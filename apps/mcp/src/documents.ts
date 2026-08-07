import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ok, err } from "./respond";
import type { Document } from "./types";

/** Document fields returned to agents (user_id omitted — it is implicit). */
const DOCUMENT_FIELDS =
  "id, title, description, html_code, css_code, template_id, template_slug, prompt_used, metadata, created_at, updated_at";

const MIN_HTML_LENGTH = 40;

/**
 * Resolve template provenance. If a slug is given, look up the template id
 * (and vice versa) so both columns can be stored. Returns null on success
 * with the resolved ids, or an error string.
 */
async function resolveTemplate(
  supabase: SupabaseClient,
  templateId?: string,
  templateSlug?: string,
): Promise<
  | { ok: true; template_id: string | null; template_slug: string | null }
  | { ok: false; error: string }
> {
  if (templateSlug) {
    const { data, error } = await supabase
      .from("pdf_templates")
      .select("id, slug")
      .eq("slug", templateSlug)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) {
      return {
        ok: false,
        error: `Template '${templateSlug}' not found. Use list_pdf_templates to see available templates.`,
      };
    }
    return { ok: true, template_id: data.id, template_slug: data.slug };
  }

  if (templateId) {
    const { data, error } = await supabase
      .from("pdf_templates")
      .select("slug")
      .eq("id", templateId)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, template_id: templateId, template_slug: data?.slug ?? null };
  }

  return { ok: true, template_id: null, template_slug: null };
}

export function registerDocumentTools(
  server: McpServer,
  supabase: SupabaseClient,
  userId: string,
) {
  server.tool(
    "create_document",
    "Save a new document (a self-contained HTML document) under the authenticated user's account. Call this after composing HTML from a pdf template blueprint. The document becomes available in the user's web editor, where they can refine it and export it as a PDF.",
    {
      title: z.string().describe("Short, descriptive title of the document"),
      html_code: z
        .string()
        .describe(
          "The full self-contained HTML document (embedded <style> allowed)",
        ),
      description: z
        .string()
        .optional()
        .describe("Optional longer description of the document"),
      template_id: z
        .string()
        .uuid()
        .optional()
        .describe("UUID of the pdf template this document was built from"),
      template_slug: z
        .string()
        .optional()
        .describe(
          "Slug of the pdf template this document was built from, e.g. 'invoice' (alternative to template_id)",
        ),
      prompt_used: z
        .string()
        .optional()
        .describe("The goal/prompt that produced this document"),
      metadata: z
        .record(z.unknown())
        .optional()
        .describe("Optional key-value metadata (e.g. task id, project name)"),
    },
    async ({
      title,
      html_code,
      description,
      template_id,
      template_slug,
      prompt_used,
      metadata,
    }) => {
      if (html_code.trim().length < MIN_HTML_LENGTH) {
        return err(
          `html_code looks too short (${html_code.trim().length} chars) to be a full HTML document.`,
        );
      }

      const template = await resolveTemplate(
        supabase,
        template_id,
        template_slug,
      );
      if (!template.ok) return err(template.error);

      const { data, error } = await supabase
        .from("visual_implementations")
        .insert({
          user_id: userId,
          title,
          description: description ?? null,
          html_code,
          template_id: template.template_id,
          template_slug: template.template_slug,
          prompt_used: prompt_used ?? null,
          metadata: metadata ?? null,
        })
        .select(DOCUMENT_FIELDS)
        .single();

      if (error) {
        return err(`Could not save document: ${error.message}`);
      }

      return ok({ saved: true, document: data as Document });
    },
  );

  server.tool(
    "list_documents",
    "List all documents saved by the authenticated user, most recently updated first.",
    {
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max documents to return (default 50)"),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Offset for pagination (default 0)"),
    },
    async ({ limit = 50, offset = 0 }) => {
      const { data, error } = await supabase
        .from("visual_implementations")
        .select(DOCUMENT_FIELDS)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return err(`Could not list documents: ${error.message}`);
      }

      return ok({
        count: (data ?? []).length,
        documents: (data ?? []) as Document[],
      });
    },
  );

  server.tool(
    "get_document",
    "Fetch a single document by id (owned by the authenticated user).",
    {
      id: z.string().uuid().describe("The UUID of the document to retrieve"),
    },
    async ({ id }) => {
      const { data, error } = await supabase
        .from("visual_implementations")
        .select(DOCUMENT_FIELDS)
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        return err(`Could not fetch document: ${error.message}`);
      }
      if (!data) {
        return err(`Document '${id}' not found or not owned by this user.`);
      }

      return ok({ document: data as Document });
    },
  );

  server.tool(
    "update_document",
    "Update fields of an existing document (only fields provided are changed).",
    {
      id: z.string().uuid().describe("The UUID of the document to update"),
      title: z.string().optional().describe("New title"),
      description: z.string().optional().describe("New description"),
      html_code: z.string().optional().describe("New HTML document"),
      css_code: z
        .string()
        .optional()
        .describe("New CSS (pass empty string to clear)"),
      template_id: z
        .string()
        .uuid()
        .optional()
        .describe("New template uuid"),
      template_slug: z
        .string()
        .optional()
        .describe("New template slug"),
      prompt_used: z.string().optional().describe("New prompt/goal text"),
      metadata: z
        .record(z.unknown())
        .optional()
        .describe("New metadata key-value pairs"),
    },
    async ({
      id,
      title,
      description,
      html_code,
      css_code,
      template_id,
      template_slug,
      prompt_used,
      metadata,
    }) => {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (html_code !== undefined) updates.html_code = html_code;
      if (css_code !== undefined) updates.css_code = css_code;
      if (prompt_used !== undefined) updates.prompt_used = prompt_used;
      if (metadata !== undefined) updates.metadata = metadata;

      if (template_id !== undefined || template_slug !== undefined) {
        const template = await resolveTemplate(
          supabase,
          template_id,
          template_slug,
        );
        if (!template.ok) return err(template.error);
        updates.template_id = template.template_id;
        updates.template_slug = template.template_slug;
      }

      const { data, error } = await supabase
        .from("visual_implementations")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select(DOCUMENT_FIELDS)
        .maybeSingle();

      if (error) {
        return err(`Could not update document: ${error.message}`);
      }
      if (!data) {
        return err(`Document '${id}' not found or not owned by this user.`);
      }

      return ok({ updated: true, document: data as Document });
    },
  );

  server.tool(
    "delete_document",
    "Delete a document by id (owned by the authenticated user).",
    {
      id: z.string().uuid().describe("The UUID of the document to delete"),
    },
    async ({ id }) => {
      const { error } = await supabase
        .from("visual_implementations")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        return err(`Could not delete document: ${error.message}`);
      }

      return ok({ deleted: true, id });
    },
  );
}
