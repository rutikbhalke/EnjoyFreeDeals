import { supabase } from "@/integrations/supabase/client";

export async function getPriceHistory(dealId: string) {
  try {
    const { data, error } = await supabase
      .from("price_history")
      .select("*")
      .eq("deal_id", dealId)
      .order("recorded_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching price history for deal "${dealId}":`, error);
    return [];
  }
}

export async function recordPricePoint(dealId: string, price: number) {
  try {
    const { data, error } = await supabase
      .from("price_history")
      .insert({
        deal_id: dealId,
        price: price,
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error(`Error recording price point for deal "${dealId}":`, error);
    return { data: null, error: error.message || "Failed to record price point" };
  }
}
