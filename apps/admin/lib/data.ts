import { createServerClient } from "@/lib/supabase/server";

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type SubCategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
};

export type ComponentRow = {
  id: string;
  name: string;
  image_url: string | null;
  sub_category_id: string;
  component_code: string;
  demo_url: string | null;
  prompt: string | null;
  chain_id: string | null;
  created_at: string;
};

export async function getCategories(): Promise<Category[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSubCategories(): Promise<SubCategory[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("sub_categories")
    .select("id, category_id, name, slug")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getComponents(): Promise<ComponentRow[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("components")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
