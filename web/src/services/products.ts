import { supabase } from "@/integrations/supabase/client";

export async function searchProducts(query: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from("deals")
      .select("*, stores(*), categories(*)")
      .eq("status", "active")
      .ilike("title", `%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error searching products in Supabase:", error);
    return [];
  }
}

export async function getProductById(id: string) {
  try {
    const { data, error } = await supabase
      .from("deals")
      .select("*, stores(*), categories(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching product for ID "${id}":`, error);
    return null;
  }
}
