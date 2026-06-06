import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useActivityTracker() {
  const { user } = useAuth();

  const track = useCallback(
    (event: {
      event_type: string;
      deal_id?: string | null;
      category_id?: string | null;
      store_id?: string | null;
      search_query?: string | null;
      metadata?: Record<string, string | number | boolean | null>;
    }) => {
      const payload = {
        user_id: user?.id ?? null,
        event_type: event.event_type,
        deal_id: event.deal_id ?? null,
        category_id: event.category_id ?? null,
        store_id: event.store_id ?? null,
        search_query: event.search_query ?? null,
        metadata: event.metadata ?? {},
      };
      // Fire-and-forget
      supabase.from("user_activity").insert([payload]).then();
    },
    [user?.id]
  );

  const trackDealView = useCallback(
    (dealId: string, categoryId?: string | null, storeId?: string | null) => {
      track({ event_type: "deal_view", deal_id: dealId, category_id: categoryId, store_id: storeId });
    },
    [track]
  );

  const trackDealClick = useCallback(
    (dealId: string, affiliateLink: string | null) => {
      track({ event_type: "deal_click", deal_id: dealId });
      // Also insert into deal_clicks for backward compatibility
      supabase.from("deal_clicks").insert({ deal_id: dealId, user_id: user?.id ?? null }).then();
      if (affiliateLink) {
        window.open(affiliateLink, "_blank");
      }
    },
    [track, user?.id]
  );

  const trackSearch = useCallback(
    (query: string) => {
      if (query.trim()) {
        track({ event_type: "search", search_query: query.trim() });
      }
    },
    [track]
  );

  const trackCategoryView = useCallback(
    (categoryId: string) => {
      track({ event_type: "category_view", category_id: categoryId });
    },
    [track]
  );

  const trackStoreView = useCallback(
    (storeId: string) => {
      track({ event_type: "store_view", store_id: storeId });
    },
    [track]
  );

  return { trackDealView, trackDealClick, trackSearch, trackCategoryView, trackStoreView };
}
