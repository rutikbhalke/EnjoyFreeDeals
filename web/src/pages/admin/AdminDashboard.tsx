import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Tag, Store, MousePointerClick, Users, Plus, Activity, MessageCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { apiRequest } from "@/lib/api";
import { useState } from "react";

function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        deals,
        activeDeals,
        stores,
        profiles,
        clicks,
        activityEvents,
        telegramSources,
        telegramDeals,
        validTelegramDeals,
        scrapeLogs,
        invalidLogs,
        duplicateLogs,
      ] = await Promise.all([
        supabase.from("deals").select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("stores").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("deal_clicks").select("id, clicked_at"),
        supabase.from("user_activity").select("id, event_type, created_at"),
        supabase.from("telegram_sources").select("channel_username, last_fetched_at, is_active").eq("is_active", true).limit(20),
        supabase.from("deals").select("id", { count: "exact", head: true }).or("source_type.eq.telegram,telegram_channel.not.is.null,raw_source_payload->>connectorMode.eq.telegram-channel"),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("status", "active").or("source_type.eq.telegram,telegram_channel.not.is.null,raw_source_payload->>connectorMode.eq.telegram-channel"),
        supabase.from("scrape_logs").select("scrape_status, created_at").eq("source_type", "telegram").order("created_at", { ascending: false }).limit(1),
        supabase.from("scrape_logs").select("id", { count: "exact", head: true }).eq("source_type", "telegram").in("scrape_status", ["failed", "rejected"]),
        supabase.from("scrape_logs").select("id", { count: "exact", head: true }).eq("source_type", "telegram").ilike("error_message", "%duplicate%"),
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
        telegram: {
          sources: telegramSources.data ?? [],
          scrapeLogs: scrapeLogs.data ?? [],
          scrapedPosts: telegramDeals.count ?? 0,
          validDeals: validTelegramDeals.count ?? 0,
          invalidPosts: invalidLogs.count ?? 0,
          duplicatePosts: duplicateLogs.count ?? 0,
        },
      };
    },
  });
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();
  const [fetchStatus, setFetchStatus] = useState("");

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Telegram Monitor
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const secret = window.prompt("Enter IMPORT_SECRET for this manual fetch") || "";
              if (!secret) {
                setFetchStatus("Import secret is required for manual fetch.");
                return;
              }
              setFetchStatus("Fetching Telegram deals...");
              const { response, body } = await apiRequest<{ message?: string; data?: { message?: string } }>("/api/admin/fetch-telegram-deals", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                  "x-import-secret": secret,
                },
                body: JSON.stringify({ limit: 25 }),
              });
              setFetchStatus(body?.data?.message || body?.message || (response.ok ? "Fetch completed." : "Fetch failed."));
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Fetch Telegram Deals
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MonitorMetric label="Sources" value={stats?.telegram.sources.length} />
            <MonitorMetric label="Scraped posts" value={stats?.telegram.scrapedPosts} />
            <MonitorMetric label="Valid deals" value={stats?.telegram.validDeals} />
            <MonitorMetric label="Invalid/no-price posts" value={stats?.telegram.invalidPosts} />
            <MonitorMetric label="Duplicate posts" value={stats?.telegram.duplicatePosts} />
            <MonitorMetric label="Last webhook status" value={stats?.telegram.scrapeLogs[0]?.scrape_status || "No logs"} text />
            <MonitorMetric
              label="Last fetch time"
              value={stats?.telegram.sources.find((source) => source.last_fetched_at)?.last_fetched_at || "Not fetched"}
              text
            />
          </div>
          {fetchStatus && <p className="text-sm text-muted-foreground">{fetchStatus}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function MonitorMetric({ label, value, text = false }: { label: string; value: unknown; text?: boolean }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-lg font-bold">{text ? String(value ?? "") : Number(value ?? 0).toLocaleString("en-IN")}</div>
    </div>
  );
}
