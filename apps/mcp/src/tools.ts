import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupabase } from "./supabase";
import {
  listCategories,
  getComponentById,
  listComponents,
  searchComponents,
  toSummary,
} from "./component-library";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VisualImplementation {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  html_code: string;
  css_code: string | null;
  source_component_ids: string[] | null;
  prompt_used: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

const VISUAL_IMPLEMENTATION_FIELDS =
  "id, title, description, html_code, css_code, source_component_ids, prompt_used, metadata, created_at, updated_at";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function err(message: string) {
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

/** Build the agent-facing bundle: component code + assembly instructions. */
function buildComponentKitText(purpose: string, componentIds: string[]) {
  const parts: string[] = [];

  parts.push(`# Visual Component Kit`);
  parts.push(`Goal: ${purpose}`);
  parts.push(``);
  parts.push(
    `Below are the component designs to use. Compose them into ONE self-contained HTML document (embedded <style> allowed, no external dependencies).`,
  );
  parts.push(``);

  for (const id of componentIds) {
    const component = getComponentById(id);
    if (!component) {
      parts.push(`## Missing component: ${id} (not found in library)`);
      parts.push(``);
      continue;
    }
    parts.push(`## ${component.name}`);
    parts.push(`ID: ${component.id}`);
    parts.push(`Category: ${component.category}`);
    parts.push(`Description: ${component.description}`);
    parts.push(`Usage guidance: ${component.prompt}`);
    parts.push(``);
    parts.push("```html");
    parts.push(component.code);
    parts.push("```");
    parts.push(``);
  }

  parts.push(`## Assembly instructions`);
  parts.push(
    `- Combine the provided designs into a cohesive page that fulfills the goal above.`,
  );
  parts.push(
    `- Keep the visual language consistent (colors, radii, spacing, typography).`,
  );
  parts.push(
    `- The result must be a full HTML document that renders standalone in an iframe.`,
  );
  parts.push(
    `- After composing, save it via create_visual_implementation, listing the source component ids in source_component_ids.`,
  );

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerTools(
  server: McpServer,
  env: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string },
  userId: string,
  token?: string,
) {
  const supabase = getSupabase(env, token);

  // --- Component design library -------------------------------------------

  server.tool(
    "list_component_categories",
    "List the categories (and sub-categories) of component designs available in the library, with component counts.",
    {},
    async () => {
      const categories = listCategories().map((c) => ({
        name: c.name,
        slug: c.slug,
        description: c.description,
        component_count: c.componentIds.length,
        component_ids: c.componentIds,
      }));
      return ok(JSON.stringify(categories, null, 2));
    },
  );

  server.tool(
    "list_components",
    "List component designs in the library (metadata only, no code). Use get_component to fetch the full design.",
    {
      category: z
        .string()
        .optional()
        .describe(
          "Filter by category name (e.g. 'Buttons', 'Hero', 'Pricing')",
        ),
      query: z
        .string()
        .optional()
        .describe("Free-text search over names, tags and descriptions"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max components to return (default 50)"),
    },
    async ({ category, query, limit = 50 }) => {
      const components = listComponents({ category, query, limit }).map(
        toSummary,
      );
      return ok(JSON.stringify(components, null, 2));
    },
  );

  server.tool(
    "get_component",
    "Fetch the full design (HTML/CSS code) of a single component by its id.",
    {
      component_id: z
        .string()
        .describe("The component id, e.g. 'hero-center' or 'btn-basic'"),
    },
    async ({ component_id }) => {
      const component = getComponentById(component_id);
      if (!component) {
        return err(
          `Component '${component_id}' not found. Use list_components to see available ids.`,
        );
      }
      return ok(
        JSON.stringify(
          {
            id: component.id,
            name: component.name,
            category: component.category,
            description: component.description,
            prompt: component.prompt,
            code: component.code,
          },
          null,
          2,
        ),
      );
    },
  );

  server.tool(
    "get_component_kit",
    "Fetch a curated set of component designs relevant to a UI goal and get assembly instructions. This is the main entry point for building a visual implementation: describe the task, receive component designs + guidance, compose them into an HTML document, then save it with create_visual_implementation.",
    {
      purpose: z
        .string()
        .describe(
          "Describe the visual design you need, e.g. 'a landing page hero with pricing and testimonials'",
        ),
      component_ids: z
        .array(z.string())
        .optional()
        .describe(
          "Optional explicit component ids to include instead of auto-matching",
        ),
      max_components: z
        .number()
        .int()
        .min(1)
        .max(8)
        .optional()
        .describe(
          "Max components to auto-match when component_ids is omitted (default 4)",
        ),
    },
    async ({ purpose, component_ids, max_components = 4 }) => {
      const ids =
        component_ids && component_ids.length > 0
          ? component_ids
          : searchComponents(purpose, max_components).map((c) => c.id);

      if (ids.length === 0) {
        return err(
          "No components found for this purpose. Try list_components to browse the library.",
        );
      }

      const text = buildComponentKitText(purpose, ids);
      return ok(text);
    },
  );

  // --- Visual implementations ---------------------------------------------

  server.tool(
    "create_visual_implementation",
    "Save a new visual implementation (a self-contained HTML/CSS design) under the authenticated user's account. Called after composing a design from the component library.",
    {
      title: z
        .string()
        .describe("Short, descriptive title of the implementation"),
      description: z
        .string()
        .optional()
        .describe("Optional longer description of what was built"),
      html_code: z
        .string()
        .describe(
          "The full HTML document (embedded <style> allowed) of the design",
        ),
      css_code: z
        .string()
        .optional()
        .describe(
          "Optional separate CSS if styles are not embedded in the HTML",
        ),
      source_component_ids: z
        .array(z.string())
        .optional()
        .describe("Component library ids used to build this design"),
      prompt_used: z
        .string()
        .optional()
        .describe("The goal/prompt that produced this implementation"),
      metadata: z
        .record(z.unknown())
        .optional()
        .describe("Optional key-value metadata (e.g. task id, project name)"),
    },
    async ({
      title,
      description,
      html_code,
      css_code,
      source_component_ids,
      prompt_used,
      metadata,
    }) => {
      const { data, error } = await supabase
        .from("visual_implementations")
        .insert({
          user_id: userId,
          title,
          description: description ?? null,
          html_code,
          css_code: css_code ?? null,
          source_component_ids: source_component_ids ?? null,
          prompt_used: prompt_used ?? null,
          metadata: metadata ?? null,
        })
        .select(VISUAL_IMPLEMENTATION_FIELDS)
        .single();

      if (error) {
        return err(`Could not save implementation: ${error.message}`);
      }

      return ok(
        JSON.stringify(
          { saved: true, implementation: data as VisualImplementation },
          null,
          2,
        ),
      );
    },
  );

  server.tool(
    "list_visual_implementations",
    "List all visual implementations saved by the authenticated user, newest first.",
    {
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max implementations to return (default 50)"),
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
        .select(VISUAL_IMPLEMENTATION_FIELDS)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return err(`Could not list implementations: ${error.message}`);
      }

      return ok(
        JSON.stringify(
          {
            count: (data ?? []).length,
            implementations: data as VisualImplementation[],
          },
          null,
          2,
        ),
      );
    },
  );

  server.tool(
    "get_visual_implementation",
    "Fetch a single visual implementation by id (owned by the authenticated user).",
    {
      id: z
        .string()
        .uuid()
        .describe("The UUID of the implementation to retrieve"),
    },
    async ({ id }) => {
      const { data, error } = await supabase
        .from("visual_implementations")
        .select(VISUAL_IMPLEMENTATION_FIELDS)
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        return err(
          `Implementation '${id}' not found or not owned by this user.`,
        );
      }

      return ok(JSON.stringify(data as VisualImplementation, null, 2));
    },
  );

  server.tool(
    "update_visual_implementation",
    "Update fields of an existing visual implementation (only fields provided are changed).",
    {
      id: z
        .string()
        .uuid()
        .describe("The UUID of the implementation to update"),
      title: z.string().optional().describe("New title"),
      description: z.string().optional().describe("New description"),
      html_code: z.string().optional().describe("New HTML document"),
      css_code: z
        .string()
        .optional()
        .describe("New CSS (pass empty string to clear)"),
      source_component_ids: z
        .array(z.string())
        .optional()
        .describe("New source component ids"),
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
      source_component_ids,
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
      if (source_component_ids !== undefined)
        updates.source_component_ids = source_component_ids;
      if (prompt_used !== undefined) updates.prompt_used = prompt_used;
      if (metadata !== undefined) updates.metadata = metadata;

      const { data, error } = await supabase
        .from("visual_implementations")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select(VISUAL_IMPLEMENTATION_FIELDS)
        .single();

      if (error || !data) {
        return err(
          `Implementation '${id}' not found or not owned by this user.`,
        );
      }

      return ok(
        JSON.stringify(
          { updated: true, implementation: data as VisualImplementation },
          null,
          2,
        ),
      );
    },
  );

  server.tool(
    "delete_visual_implementation",
    "Delete a visual implementation by id (owned by the authenticated user).",
    {
      id: z
        .string()
        .uuid()
        .describe("The UUID of the implementation to delete"),
    },
    async ({ id }) => {
      const { error } = await supabase
        .from("visual_implementations")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        return err(`Could not delete implementation: ${error.message}`);
      }

      return ok(JSON.stringify({ deleted: true, id }, null, 2));
    },
  );
}
