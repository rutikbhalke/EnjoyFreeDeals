import { supabase } from "@/integrations/supabase/client";

export async function getRecentlyViewed(userId: string, limit = 8) {
  try {
    const { data: activity, error: activityError } = await supabase
      .from("user_activity")
      .select("deal_id")
      .eq("user_id", userId)
      .eq("event_type", "deal_view")
      .not("deal_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (activityError) throw activityError;
    if (!activity || activity.length === 0) return [];

    // Deduplicate
    const seen = new Set<string>();
    const dealIds: string[] = [];
    for (const row of activity) {
      if (row.deal_id && !seen.has(row.deal_id)) {
        seen.add(row.deal_id);
        dealIds.push(row.deal_id);
        if (dealIds.length >= limit) break;
      }
    }

    if (dealIds.length === 0) return [];

    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("*, stores(*), categories(*)")
      .in("id", dealIds)
      .eq("status", "active");

    if (dealsError) throw dealsError;
    if (!deals) return [];

    // Maintain recent ordering
    const dealMap = new Map(deals.map((d) => [d.id, d]));
    return dealIds.map((id) => dealMap.get(id)).filter(Boolean);
  } catch (error) {
    console.error("Error fetching recently viewed deals:", error);
    return [];
  }
}

export async function logDealView(userId: string | null, dealId: string) {
  try {
    const { data, error } = await supabase
      .from("user_activity")
      .insert({
        user_id: userId,
        deal_id: dealId,
        event_type: "deal_view",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error("Error logging deal view activity:", error);
    return { data: null, error: error.message || "Failed to log activity" };
  }
}
