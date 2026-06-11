import { supabase } from "@/integrations/supabase/client";

export async function getSavedDeals(userId: string) {
  try {
    const { data, error } = await supabase
      .from("deal_watchlist")
      .select("*, deals(*, stores(*), categories(*))")
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching saved deals:", error);
    return [];
  }
}

export async function saveDeal(userId: string, dealId: string, targetPrice?: number) {
  try {
    const { data, error } = await supabase
      .from("deal_watchlist")
      .insert({
        user_id: userId,
        deal_id: dealId,
        target_price: targetPrice || null,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error("Error saving deal to watchlist:", error);
    return { data: null, error: error.message || "Failed to save deal" };
  }
}

export async function unsaveDeal(userId: string, dealId: string) {
  try {
    const { error } = await supabase
      .from("deal_watchlist")
      .delete()
      .eq("user_id", userId)
      .eq("deal_id", dealId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error removing deal from watchlist:", error);
    return { success: false, error: error.message || "Failed to remove deal" };
  }
}
