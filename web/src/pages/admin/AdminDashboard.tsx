import { type ReactNode, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ImageOff,
  MessageCircle,
  MousePointerClick,
  Pencil,
  RefreshCw,
  Store,
  Tag,
  Users,
  XCircle,
} from "lucide-react";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  apiRequest,
  approveAdminDeal,
  fetchAdminFlaggedDeals,
  rejectAdminDeal,
  updateAdminDeal,
  type FlaggedDeal,
} from "@/lib/api";

type ReviewSection =
  | "all"
  | "telegram"
  | "missing_image"
  | "zero_price"
  | "price_mismatch"
  | "pending"
  | "approved"
  | "rejected";

type EditForm = {
  title: string;
  imageUrl: string;
  productUrl: string;
  storeName: string;
  categoryName: string;
  originalPrice: string;
  dealPrice: string;
  priceRangeMin: string;
  priceRangeMax: string;
  couponCode: string;
  availability: string;
  adminNotes: string;
  isValid: boolean;
  isExpired: boolean;
};

const sections: Array<{ key: ReviewSection; label: string }> = [
  { key: "all", label: "Flagged Deals" },
  { key: "telegram", label: "Telegram Scraped Deals" },
  { key: "missing_image", label: "Missing Image Deals" },
  { key: "zero_price", label: "Zero Price Deals" },
  { key: "price_mismatch", label: "Price Mismatch Deals" },
  { key: "pending", label: "Pending Approval Deals" },
  { key: "approved", label: "Approved Deals" },
  { key: "rejected", label: "Rejected Deals" },
];

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

      const days: Record<string, number> = {};
      const viewDays: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days[key] = 0;
        viewDays[key] = 0;
      }

      (clicks.data ?? []).forEach((click) => {
        const day = String(click.clicked_at || "").slice(0, 10);
        if (day in days) days[day]++;
      });

      (activityEvents.data ?? [])
        .filter((event) => event.event_type === "deal_view")
        .forEach((event) => {
          const day = String(event.created_at || "").slice(0, 10);
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
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const [fetchStatus, setFetchStatus] = useState("");
  const [section, setSection] = useState<ReviewSection>("all");
  const [editing, setEditing] = useState<FlaggedDeal | null>(null);
  const [form, setForm] = useState<EditForm>(emptyForm());

  const { data, isLoading: reviewLoading } = useQuery({
    queryKey: ["admin-flagged-deals", section],
    queryFn: () => fetchAdminFlaggedDeals(section),
  });

  const { data: allReviewData } = useQuery({
    queryKey: ["admin-flagged-deals", "all", "telegram-section"],
    queryFn: () => fetchAdminFlaggedDeals("all"),
  });

  const items = data?.items || [];
  const summary = data?.summary;
  const telegramItems = useMemo(
    () => (allReviewData?.items || items).filter((item) => String(item.sourceType || "").includes("telegram")),
    [allReviewData?.items, items]
  );

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("No deal selected.");
      return updateAdminDeal(editing.id, payloadFromForm(form));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-flagged-deals"] });
      toast({ title: "Deal updated" });
      setEditing(null);
    },
    onError: (error: Error) => toast({ title: "Save failed", description: error.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: (deal: FlaggedDeal) => {
      const allowMissingImage = !deal.imageUrl || deal.flags.includes("missing_image")
        ? window.confirm("Approve this deal without a verified image?")
        : false;
      return approveAdminDeal(deal.id, { allowMissingImage, allowFlags: true });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-flagged-deals"] });
      toast({ title: "Deal approved" });
      setEditing(null);
    },
    onError: (error: Error) => toast({ title: "Approve failed", description: error.message, variant: "destructive" }),
  });

  const approveEditedMutation = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error("No deal selected.");
      const allowMissingImage = !form.imageUrl
        ? window.confirm("Approve this deal without a verified image?")
        : false;
      await updateAdminDeal(editing.id, {
        ...payloadFromForm(form),
        allowMissingImage,
      });
      return approveAdminDeal(editing.id, { allowMissingImage, allowFlags: true });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-flagged-deals"] });
      toast({ title: "Deal approved" });
      setEditing(null);
    },
    onError: (error: Error) => toast({ title: "Approve failed", description: error.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (deal: FlaggedDeal) => {
      const reason = window.prompt("Reject reason", deal.flags.join(", ") || "Rejected by admin.");
      if (reason === null) throw new Error("Reject cancelled.");
      return rejectAdminDeal(deal.id, reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-flagged-deals"] });
      toast({ title: "Deal rejected" });
      setEditing(null);
    },
    onError: (error: Error) => {
      if (error.message !== "Reject cancelled.") {
        toast({ title: "Reject failed", description: error.message, variant: "destructive" });
      }
    },
  });

  const openEdit = (deal: FlaggedDeal) => {
    setEditing(deal);
    setForm(formFromDeal(deal));
  };

  const cards = [
    { label: "Total Stores", value: stats?.totalStores, icon: Store },
    { label: "Total Clicks", value: stats?.totalClicks, icon: MousePointerClick },
    { label: "Activity Events", value: stats?.totalActivity, icon: Activity },
    { label: "Total Users", value: stats?.totalUsers, icon: Users },
  ];

  return (
    <div className="space-y-7">
      <SEO title="Admin Dashboard - EnjoyFreeDeals" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">Deals review queue, Telegram monitor, and flagged deal controls.</p>
        </div>
        <Button size="sm" asChild>
          <Link to="/admin/deals">
            <Tag className="mr-1 h-4 w-4" />
            Manage Deals
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <SummaryCard label="Total deals" value={summary?.totalDeals ?? stats?.totalDeals} icon={<Tag className="h-4 w-4" />} />
        <SummaryCard label="Active deals" value={summary?.activeDeals ?? stats?.activeDeals} icon={<CheckCircle className="h-4 w-4" />} />
        <SummaryCard label="Flagged deals" value={summary?.flaggedDeals} icon={<AlertTriangle className="h-4 w-4" />} />
        <SummaryCard label="Missing image" value={summary?.missingImage} icon={<ImageOff className="h-4 w-4" />} />
        <SummaryCard label="Zero price" value={summary?.zeroPrice} icon={<XCircle className="h-4 w-4" />} />
        <SummaryCard label="Pending review" value={summary?.pendingReview} icon={<AlertTriangle className="h-4 w-4" />} />
        <SummaryCard label="Telegram deals" value={summary?.telegramDeals ?? stats?.telegram.scrapedPosts} icon={<MessageCircle className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? "..." : card.value}</div>
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
          <Button size="sm" variant="outline" onClick={() => fetchTelegramDeals(setFetchStatus)}>
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

      <div className="flex flex-wrap gap-2">
        {sections.map((item) => (
          <Button
            key={item.key}
            variant={section === item.key ? "default" : "outline"}
            size="sm"
            onClick={() => setSection(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Deals Review Queue</h2>
          <Badge variant="secondary">{items.length} rows</Badge>
        </div>
        <FlaggedDealsTable
          items={items}
          loading={reviewLoading}
          onEdit={openEdit}
          onApprove={(deal) => approveMutation.mutate(deal)}
          onReject={(deal) => rejectMutation.mutate(deal)}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Telegram Review Section</h2>
        </div>
        <FlaggedDealsTable
          items={telegramItems}
          loading={reviewLoading}
          onEdit={openEdit}
          onApprove={(deal) => approveMutation.mutate(deal)}
          onReject={(deal) => rejectMutation.mutate(deal)}
          compact
        />
      </section>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
              <Field label="Image URL" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
              <Field label="Product URL" value={form.productUrl} onChange={(value) => setForm({ ...form, productUrl: value })} />
              <Field label="Store name" value={form.storeName} onChange={(value) => setForm({ ...form, storeName: value })} />
              <Field label="Category" value={form.categoryName} onChange={(value) => setForm({ ...form, categoryName: value })} />
              <Field label="Coupon code" value={form.couponCode} onChange={(value) => setForm({ ...form, couponCode: value })} />
              <Field label="Original price" type="number" value={form.originalPrice} onChange={(value) => setForm({ ...form, originalPrice: value })} />
              <Field label="Deal price" type="number" value={form.dealPrice} onChange={(value) => setForm({ ...form, dealPrice: value })} />
              <Field label="Price range min" type="number" value={form.priceRangeMin} onChange={(value) => setForm({ ...form, priceRangeMin: value })} />
              <Field label="Price range max" type="number" value={form.priceRangeMax} onChange={(value) => setForm({ ...form, priceRangeMax: value })} />
              <Field label="Availability" value={form.availability} onChange={(value) => setForm({ ...form, availability: value })} />
            </div>
            <div className="space-y-2">
              <Label>Admin notes</Label>
              <Textarea value={form.adminNotes} onChange={(event) => setForm({ ...form, adminNotes: event.target.value })} rows={3} />
            </div>
            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={form.isValid} onCheckedChange={(value) => setForm({ ...form, isValid: Boolean(value) })} />
                isValid
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={form.isExpired} onCheckedChange={(value) => setForm({ ...form, isExpired: Boolean(value) })} />
                isExpired
              </label>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => editing && rejectMutation.mutate(editing)} disabled={rejectMutation.isPending}>
                Reject deal
              </Button>
              <Button type="button" variant="outline" onClick={() => approveEditedMutation.mutate()} disabled={approveEditedMutation.isPending}>
                Approve deal
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

async function fetchTelegramDeals(setFetchStatus: (value: string) => void) {
  const secret = window.prompt("Enter IMPORT_SECRET for this manual fetch") || "";
  if (!secret) {
    setFetchStatus("Import secret is required for manual fetch.");
    return;
  }
  setFetchStatus("Fetching Telegram deals...");
  try {
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
  } catch (error) {
    setFetchStatus(error instanceof Error ? error.message : "Fetch failed.");
  }
}

function SummaryCard({ label, value, icon }: { label: string; value?: number; icon: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value ?? "-"}</div>
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

function FlaggedDealsTable({
  items,
  loading,
  onEdit,
  onApprove,
  onReject,
  compact = false,
}: {
  items: FlaggedDeal[];
  loading: boolean;
  onEdit: (deal: FlaggedDeal) => void;
  onApprove: (deal: FlaggedDeal) => void;
  onReject: (deal: FlaggedDeal) => void;
  compact?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Title</TableHead>
            {!compact && <TableHead>Store</TableHead>}
            {!compact && <TableHead>Category</TableHead>}
            <TableHead>Deal price</TableHead>
            {!compact && <TableHead>Original price</TableHead>}
            <TableHead>Flags</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={compact ? 6 : 9} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
          ) : items.length === 0 ? (
            <TableRow><TableCell colSpan={compact ? 6 : 9} className="py-8 text-center text-muted-foreground">No deals in this queue.</TableCell></TableRow>
          ) : items.map((deal) => (
            <TableRow key={deal.id}>
              <TableCell>
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-secondary">
                  {deal.imageUrl ? (
                    <img src={deal.imageUrl} alt={deal.title} className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell className="max-w-[260px]">
                <div className="line-clamp-2 font-medium">{deal.title || "Untitled deal"}</div>
                <div className="text-xs text-muted-foreground">{deal.productUrl || "No product URL"}</div>
              </TableCell>
              {!compact && <TableCell>{deal.storeName || "Store"}</TableCell>}
              {!compact && <TableCell>{deal.categoryName || "Other Deals"}</TableCell>}
              <TableCell>{formatMoney(deal.dealPrice)}</TableCell>
              {!compact && <TableCell>{formatMoney(deal.originalPrice)}</TableCell>}
              <TableCell className="max-w-[240px]">
                <div className="flex flex-wrap gap-1">
                  {deal.flags.slice(0, compact ? 2 : 5).map((flag) => (
                    <Badge key={flag} variant={flag.includes("price") || flag.includes("image") ? "destructive" : "secondary"} className="text-xs">
                      {flag.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell><Badge variant={deal.status === "approved" || deal.status === "active" ? "default" : "secondary"}>{deal.status}</Badge></TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(deal)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" title="Approve" onClick={() => onApprove(deal)}><CheckCircle className="h-4 w-4 text-primary" /></Button>
                  <Button variant="ghost" size="icon" title="Reject" onClick={() => onReject(deal)}><XCircle className="h-4 w-4 text-destructive" /></Button>
                  <Button variant="ghost" size="icon" title="View deal" asChild>
                    <Link to={`/deals/${deal.slug || deal.id}`}><ExternalLink className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function formFromDeal(deal: FlaggedDeal): EditForm {
  return {
    title: deal.title || "",
    imageUrl: deal.imageUrl || "",
    productUrl: deal.productUrl || "",
    storeName: deal.storeName || "",
    categoryName: deal.categoryName || "Other Deals",
    originalPrice: stringOrEmpty(deal.originalPrice),
    dealPrice: stringOrEmpty(deal.dealPrice),
    priceRangeMin: stringOrEmpty(deal.priceRangeMin),
    priceRangeMax: stringOrEmpty(deal.priceRangeMax),
    couponCode: deal.couponCode || "",
    availability: deal.availability || "",
    adminNotes: deal.adminNotes || "",
    isValid: deal.status === "approved" || deal.status === "active",
    isExpired: false,
  };
}

function emptyForm(): EditForm {
  return formFromDeal({
    id: "",
    title: "",
    storeName: "",
    imageUrl: null,
    dealPrice: null,
    originalPrice: null,
    categoryName: "Other Deals",
    productUrl: "",
    flags: [],
    status: "pending_review",
  });
}

function numericOrNull(value: string) {
  if (value.trim() === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function stringOrEmpty(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `Rs. ${Number(value).toLocaleString("en-IN")}`;
}

function payloadFromForm(form: EditForm) {
  return {
    title: form.title,
    imageUrl: form.imageUrl,
    productUrl: form.productUrl,
    storeName: form.storeName,
    categoryName: form.categoryName || "Other Deals",
    originalPrice: numericOrNull(form.originalPrice),
    dealPrice: numericOrNull(form.dealPrice),
    priceRangeMin: numericOrNull(form.priceRangeMin),
    priceRangeMax: numericOrNull(form.priceRangeMax),
    couponCode: form.couponCode,
    availability: form.availability,
    adminNotes: form.adminNotes,
    isValid: form.isValid,
    isExpired: form.isExpired,
  };
}
