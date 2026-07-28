import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupabase } from "./supabase";

interface Item {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function registerTools(
  server: McpServer,
  env: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string },
  userId: string
) {
  const supabase = getSupabase(env);

  server.tool(
    "create_item",
    "Create a new item/record",
    {
      name: z.string().describe("The name of the item"),
      description: z.string().optional().describe("A description for the item"),
      metadata: z
        .record(z.unknown())
        .optional()
        .describe("Optional metadata as key-value pairs"),
    },
    async ({ name, description, metadata }) => {
      const { data, error } = await supabase
        .from("items")
        .insert({
          user_id: userId,
          name,
          description: description ?? null,
          metadata: metadata ?? null,
        })
        .select()
        .single();

      if (error) {
        return {
          content: [
            { type: "text" as const, text: `Error creating item: ${error.message}` },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data as Item, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_item",
    "Get an item by ID",
    {
      id: z.string().uuid().describe("The UUID of the item to retrieve"),
    },
    async ({ id }) => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (error) {
        return {
          content: [
            { type: "text" as const, text: `Error fetching item: ${error.message}` },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data as Item, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "list_items",
    "List all items for the authenticated user",
    {
      limit: z.number().int().min(1).max(100).optional().describe("Max items to return (default 50)"),
      offset: z.number().int().min(0).optional().describe("Offset for pagination (default 0)"),
    },
    async ({ limit = 50, offset = 0 }) => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return {
          content: [
            { type: "text" as const, text: `Error listing items: ${error.message}` },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data as Item[], null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "update_item",
    "Update an existing item",
    {
      id: z.string().uuid().describe("The UUID of the item to update"),
      name: z.string().optional().describe("New name for the item"),
      description: z.string().optional().describe("New description"),
      metadata: z
        .record(z.unknown())
        .optional()
        .describe("New metadata key-value pairs"),
    },
    async ({ id, name, description, metadata }) => {
      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (metadata !== undefined) updates.metadata = metadata;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("items")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        return {
          content: [
            { type: "text" as const, text: `Error updating item: ${error.message}` },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data as Item, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "delete_item",
    "Delete an item by ID",
    {
      id: z.string().uuid().describe("The UUID of the item to delete"),
    },
    async ({ id }) => {
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        return {
          content: [
            { type: "text" as const, text: `Error deleting item: ${error.message}` },
          ],
          isError: true,
        };
      }

      return {
        content: [
          { type: "text" as const, text: `Item ${id} deleted successfully` },
        ],
      };
    }
  );
}
