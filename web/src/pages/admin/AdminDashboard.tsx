import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Tag, Store, MousePointerClick, Users, Plus, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [deals, activeDeals, stores, profiles, clicks, activityEvents] = await Promise.all([
        supabase.from("deals").select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("stores").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("deal_clicks").select("id, clicked_at"),
        supabase.from("user_activity").select("id, event_type, created_at"),
      ]);
      
      // Build last 7 days chart
      const days: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days[d.toISOString().slice(0, 10)] = 0;
      }
      (clicks.data ?? []).forEach((c) => {
        const day = c.clicked_at.slice(0, 10);
        if (day in days) days[day]++;
      });

      // Build deal views per day
      const viewDays: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        viewDays[d.toISOString().slice(0, 10)] = 0;
      }
      (activityEvents.data ?? []).filter(e => e.event_type === "deal_view").forEach((e) => {
        const day = e.created_at.slice(0, 10);
        if (day in viewDays) viewDays[day]++;
      });

      const chartData = Object.entries(days).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString("en", { weekday: "short" }),
        clicks: count,
        views: viewDays[date] ?? 0,
      }));

      return {
        totalDeals: deals.count ?? 0,
        activeDeals: activeDeals.count ?? 0,
        totalStores: stores.count ?? 0,
        totalUsers: profiles.count ?? 0,
        totalClicks: (clicks.data ?? []).length,
        totalActivity: (activityEvents.data ?? []).length,
        chartData,
      };
    },
  });
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  const cards = [
    { label: "Total Deals", value: stats?.totalDeals, icon: Tag },
    { label: "Active Deals", value: stats?.activeDeals, icon: Tag },
    { label: "Total Clicks", value: stats?.totalClicks, icon: MousePointerClick },
    { label: "Activity Events", value: stats?.totalActivity, icon: Activity },
    { label: "Total Users", value: stats?.totalUsers, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <SEO title="Admin Dashboard – EnjoyFreeDeals" />
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button size="sm" asChild><Link to="/admin/deals"><Plus className="mr-1 h-4 w-4" />Add Deal</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/admin/stores"><Plus className="mr-1 h-4 w-4" />Add Store</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "…" : c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clicks & Views (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {stats?.chartData && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="clicks" fill="hsl(142, 63%, 27%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="views" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
