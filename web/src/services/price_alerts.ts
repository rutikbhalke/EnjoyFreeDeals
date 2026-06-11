import { supabase } from "@/integrations/supabase/client";

export async function getPriceAlerts(userId: string) {
  try {
    const { data, error } = await supabase
      .from("deal_watchlist")
      .select("*, deals(*, stores(*), categories(*))")
      .eq("user_id", userId)
      .not("target_price", "is", null);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching price alerts:", error);
    return [];
  }
}

export async function createPriceAlert(userId: string, dealId: string, targetPrice: number) {
  try {
    // Upsert to deal_watchlist setting target_price
    const { data, error } = await supabase
      .from("deal_watchlist")
      .upsert({
        user_id: userId,
        deal_id: dealId,
        target_price: targetPrice,
      }, { onConflict: "user_id,deal_id" })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error("Error setting price alert:", error);
    return { data: null, error: error.message || "Failed to set price alert" };
  }
}

export async function deletePriceAlert(userId: string, dealId: string) {
  try {
    // Instead of deleting the row, we can just clear target_price, or delete the row if they don't want it watched at all.
    // Standard behavior is to clear the target_price, or delete if no longer watching.
    const { error } = await supabase
      .from("deal_watchlist")
      .delete()
      .eq("user_id", userId)
      .eq("deal_id", dealId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error deleting price alert:", error);
    return { success: false, error: error.message || "Failed to remove price alert" };
  }
}
