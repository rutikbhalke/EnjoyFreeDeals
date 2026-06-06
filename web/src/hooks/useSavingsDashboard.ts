import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SavingsData {
  totalSavings: number;
  totalDeals: number;
  monthlySavings: { month: string; savings: number; count: number }[];
  byStore: { name: string; savings: number; count: number }[];
  byCategory: { name: string; savings: number; count: number }[];
}

export function useSavingsDashboard() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["savings-dashboard", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SavingsData> => {
      // Get all deal clicks by this user with deal + store + category info
      const { data: clicks, error } = await supabase
        .from("deal_clicks")
        .select("clicked_at, deals(original_price, discounted_price, store_id, category_id, stores(name), categories(name))")
        .eq("user_id", user!.id)
        .order("clicked_at", { ascending: true });

      if (error) throw error;

      let totalSavings = 0;
      let totalDeals = 0;
      const monthlyMap = new Map<string, { savings: number; count: number }>();
      const storeMap = new Map<string, { savings: number; count: number }>();
      const categoryMap = new Map<string, { savings: number; count: number }>();

      const seenDeals = new Set<string>();

      for (const click of clicks ?? []) {
        const deal = click.deals as any;
        if (!deal || deal.original_price == null || deal.discounted_price == null) continue;
        if (deal.original_price <= deal.discounted_price) continue;

        const saving = deal.original_price - deal.discounted_price;
        
        // Deduplicate by a rough key to avoid counting same deal twice
        const dealKey = `${deal.store_id}-${deal.original_price}-${deal.discounted_price}`;
        if (seenDeals.has(dealKey)) continue;
        seenDeals.add(dealKey);

        totalSavings += saving;
        totalDeals++;

        // Monthly
        const month = new Date(click.clicked_at).toISOString().slice(0, 7); // YYYY-MM
        const mEntry = monthlyMap.get(month) ?? { savings: 0, count: 0 };
        mEntry.savings += saving;
        mEntry.count++;
        monthlyMap.set(month, mEntry);

        // Store
        const storeName = deal.stores?.name ?? "Other";
        const sEntry = storeMap.get(storeName) ?? { savings: 0, count: 0 };
        sEntry.savings += saving;
        sEntry.count++;
        storeMap.set(storeName, sEntry);

        // Category
        const catName = deal.categories?.name ?? "Uncategorized";
        const cEntry = categoryMap.get(catName) ?? { savings: 0, count: 0 };
        cEntry.savings += saving;
        cEntry.count++;
        categoryMap.set(catName, cEntry);
      }

      const monthlySavings = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);

      const byStore = Array.from(storeMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 10);

      const byCategory = Array.from(categoryMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 10);

      return { totalSavings, totalDeals, monthlySavings, byStore, byCategory };
    },
  });
}
