"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import type { TemplateBlueprint, TemplateComponent } from "@/lib/template-types";

export type TemplateState = { error?: string; ok?: boolean };

function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "untitled-template"
  );
}

/** Validate + coerce the blueprint parsed from the form. */
function parseBlueprint(raw: string): TemplateBlueprint | null {
  try {
    const bp = JSON.parse(raw) as TemplateBlueprint;
    if (!bp || typeof bp !== "object") return null;
    if (!bp.page || typeof bp.page !== "object") return null;
    if (!Array.isArray(bp.components)) return null;

    return {
      version: 2,
      page: {
        format: strFrom(bp.page.format) || "A4",
        content_width: strFrom(bp.page.content_width) || "794px",
        margin: strFrom(bp.page.margin) || "2.5rem",
        body_background: strFrom(bp.page.body_background) || "#ffffff",
      },
      structure: strFrom(bp.structure) || "",
      components: (Array.isArray(bp.components) ? bp.components : [])
        .filter((c) => c && typeof c === "object")
        .map((c) => ({
          key: (strFrom((c as TemplateComponent).key) || "section").replace(
            /\s+/g,
            "-",
          ),
          name: strFrom((c as TemplateComponent).name) || "Unnamed block",
          description: strFrom((c as TemplateComponent).description),
          guidance: strFrom((c as TemplateComponent).guidance),
          required: Boolean((c as TemplateComponent).required),
          html: strFrom((c as TemplateComponent).html),
          css: strFrom((c as TemplateComponent).css),
          tags: Array.isArray((c as TemplateComponent).tags)
            ? (c as TemplateComponent).tags
                .map((t) => strFrom(t))
                .filter(Boolean)
            : [],
          group: strFrom((c as TemplateComponent).group) || undefined,
        })),
      requirements: Array.isArray(bp.requirements)
        ? (bp.requirements as unknown[])
            .map((r) => (typeof r === "string" ? r.trim() : ""))
            .filter(Boolean)
        : [],
    };
  } catch {
    return null;
  }
}

function strFrom(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function readCommon(formData: FormData) {
  const name = str(formData.get("name"));
  const slug = str(formData.get("slug")) || slugify(name);
  const description = str(formData.get("description")) || null;
  const categoryValue = str(formData.get("category"));
  const category = categoryValue || null;
  const tags = str(formData.get("tags"))
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const isActive =
    formData.get("is_active") === "on" ||
    formData.get("is_active") === "true";
  const blueprint = parseBlueprint(str(formData.get("blueprint")));
  return { name, slug, description, category, tags, isActive, blueprint };
}

export async function createTemplate(
  _prev: TemplateState,
  formData: FormData
): Promise<TemplateState> {
  const { name, slug, description, category, tags, isActive, blueprint } =
    readCommon(formData);

  if (!name) return { error: "Template name is required." };
  if (!blueprint) return { error: "Blueprint JSON is invalid." };

  const supabase = await createServerClient();
  const { error } = await supabase.from("pdf_templates").insert({
    slug,
    name,
    description,
    category,
    blueprint,
    tags,
    is_active: isActive,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/templates");
  return { ok: true };
}

export async function updateTemplate(
  _prev: TemplateState,
  formData: FormData
): Promise<TemplateState> {
  const id = str(formData.get("id"));
  const { name, slug, description, category, tags, isActive, blueprint } =
    readCommon(formData);

  if (!id) return { error: "Missing template id." };
  if (!name) return { error: "Template name is required." };
  if (!blueprint) return { error: "Blueprint JSON is invalid." };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("pdf_templates")
    .update({
      slug,
      name,
      description,
      category,
      blueprint,
      tags,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/templates");
  revalidatePath(`/dashboard/templates/${id}`);
  return { ok: true };
}