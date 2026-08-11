import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ok, err } from "./respond";
import type { PdfTemplate } from "./types";

/** Template rows returned by list (metadata only — no blueprint). */
const LIST_FIELDS =
  "id, slug, name, description, category, tags, is_active, created_at, updated_at";
/** Full row including the blueprint, returned by get. */
const FULL_FIELDS =
  "id, slug, name, description, category, blueprint, tags, is_active, created_at, updated_at";

export function registerTemplateTools(
  server: McpServer,
  supabase: SupabaseClient,
) {
  server.tool(
    "list_pdf_templates",
    "List the PDF templates available to build a document from. Returns template metadata only (id, slug, name, category, tags) — use get_pdf_template to fetch the full blueprint outline for the one you want to use. This is the first step when a user asks for a new document.",
    {
      category: z
        .string()
        .optional()
        .describe(
          "Filter by template category (e.g. 'Reports', 'Business', 'Technical', 'General')",
        ),
      query: z
        .string()
        .optional()
        .describe("Free-text search over template names, descriptions and tags"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max templates to return (default 50)"),
    },
    async ({ category, query, limit = 50 }) => {
      let q = supabase
        .from("pdf_templates")
        .select(LIST_FIELDS)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (category) {
        q = q.ilike("category", `%${category}%`);
      }

      const { data, error } = await q;

      if (error) {
        return err(`Could not list templates: ${error.message}`);
      }

      let templates = (data ?? []) as Array<
        Omit<PdfTemplate, "blueprint">
      >;

      if (query) {
        const q = query.toLowerCase();
        templates = templates.filter((t) =>
          [
            t.name,
            t.description ?? "",
            t.category ?? "",
            (t.tags ?? []).join(" "),
          ]
            .join(" ")
            .toLowerCase()
            .includes(q),
        );
      }

      templates = templates.slice(0, limit);

      return ok({
        count: templates.length,
        templates: templates.map((t) => ({
          id: t.id,
          slug: t.slug,
          name: t.name,
          description: t.description,
          category: t.category,
          tags: t.tags,
          is_active: t.is_active,
        })),
      });
    },
  );

  server.tool(
    "get_pdf_template",
    "Fetch the full blueprint of a single PDF template by slug or id. The blueprint contains the page constraints, the response structure (the overall HTML skeleton agents use to assemble their output, with a <!--content--> injection point), the list of component blocks (each carries its own HTML structure, CSS design, description and authoring guidance), and the global requirements for the final HTML document. Use the component html/css as the design source for matching blocks in the generated document, and follow the response structure to assemble it. Then save it with create_document. This is the main entry point for building a new document.",
    {
      template_id: z
        .string()
        .uuid()
        .optional()
        .describe("The UUID of the template to fetch (provide this OR slug)"),
      slug: z
        .string()
        .optional()
        .describe(
          "The template slug, e.g. 'business-report' or 'invoice' (provide this OR template_id)",
        ),
    },
    async ({ template_id, slug }) => {
      if (!template_id && !slug) {
        return err("Provide either template_id or slug.");
      }

      let q = supabase.from("pdf_templates").select(FULL_FIELDS);

      if (template_id) q = q.eq("id", template_id);
      else q = q.eq("slug", slug as string);

      const { data, error } = await q.maybeSingle();

      if (error) {
        return err(`Could not fetch template: ${error.message}`);
      }
      if (!data) {
        return err(
          `Template not found. Use list_pdf_templates to see available templates.`,
        );
      }

      return ok({ template: data as PdfTemplate });
    },
  );
}
