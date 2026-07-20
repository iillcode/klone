"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export type ComponentState = { error?: string; ok?: boolean };

function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function createComponent(
  _prev: ComponentState,
  formData: FormData
): Promise<ComponentState> {
  const name = str(formData.get("name"));
  const imageUrl = str(formData.get("image_url"));
  const subCategoryId = str(formData.get("sub_category_id"));
  const componentCode = str(formData.get("component_code"));
  const demoUrl = str(formData.get("demo_url"));
  const prompt = str(formData.get("prompt"));
  const chainId = str(formData.get("chain_id"));

  if (!name) return { error: "Component name is required." };
  if (!subCategoryId) return { error: "Sub-category is required." };
  if (!componentCode) return { error: "Component code is required." };

  const supabase = await createServerClient();
  const { error } = await supabase.from("components").insert({
    name,
    image_url: imageUrl || null,
    sub_category_id: subCategoryId,
    component_code: componentCode,
    demo_url: demoUrl || null,
    prompt: prompt || null,
    chain_id: chainId || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateComponent(
  _prev: ComponentState,
  formData: FormData
): Promise<ComponentState> {
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  const imageUrl = str(formData.get("image_url"));
  const subCategoryId = str(formData.get("sub_category_id"));
  const componentCode = str(formData.get("component_code"));
  const demoUrl = str(formData.get("demo_url"));
  const prompt = str(formData.get("prompt"));
  const chainId = str(formData.get("chain_id"));

  if (!id) return { error: "Missing component id." };
  if (!name) return { error: "Component name is required." };
  if (!subCategoryId) return { error: "Sub-category is required." };
  if (!componentCode) return { error: "Component code is required." };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("components")
    .update({
      name,
      image_url: imageUrl || null,
      sub_category_id: subCategoryId,
      component_code: componentCode,
      demo_url: demoUrl || null,
      prompt: prompt || null,
      chain_id: chainId || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}
