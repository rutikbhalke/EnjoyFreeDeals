import { supabase } from "@/integrations/supabase/client";

export async function getSharedDeals(userId: string) {
  try {
    const { data, error } = await supabase
      .from("shared_deals" as any)
      .select("*, deals(*, stores(*), categories(*))" as any)
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching shared deals:", error);
    return [];
  }
}

export async function logSharedDeal(userId: string, dealId: string) {
  try {
    const { data, error } = await supabase
      .from("shared_deals" as any)
      .insert({
        user_id: userId,
        deal_id: dealId,
        created_at: new Date().toISOString(),
      } as any)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error("Error logging shared deal:", error);
    return { data: null, error: error.message || "Failed to log shared deal" };
  }
}
