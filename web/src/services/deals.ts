import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type DealRow = Database["public"]["Tables"]["deals"]["Row"];
type DealInsert = Database["public"]["Tables"]["deals"]["Insert"];
type DealUpdate = Database["public"]["Tables"]["deals"]["Update"];

export async function getDeals(limit = 48, status: DealRow["status"] = "active") {
  try {
    const { data, error } = await supabase
      .from("deals")
      .select("*, stores(*), categories(*)")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching deals from Supabase:", error);
    return [];
  }
}

export async function getDealBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from("deals")
      .select("*, stores(*), categories(*)")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching deal for slug "${slug}":`, error);
    return null;
  }
}

export async function createDeal(deal: DealInsert) {
  try {
    const { data, error } = await supabase
      .from("deals")
      .insert(deal)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error("Error creating deal in Supabase:", error);
    return { data: null, error: error.message || "Failed to create deal" };
  }
}

export async function updateDeal(id: string, deal: DealUpdate) {
  try {
    const { data, error } = await supabase
      .from("deals")
      .update(deal)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error(`Error updating deal ${id}:`, error);
    return { data: null, error: error.message || "Failed to update deal" };
  }
}
