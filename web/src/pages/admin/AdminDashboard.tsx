import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ImageOff,
  KeyRound,
  MessageCircle,
  MousePointerClick,
  Pencil,
  Plus,
  RefreshCw,
  Store,
  Tag,
  Upload,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  description: string;
  isValid: boolean;
  isExpired: boolean;
};

const STATUS_OPTIONS = [
  { value: "pending_review", label: "Pending Review" },
  { value: "active", label: "Active" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "draft", label: "Draft" },
];

const CATEGORY_OPTIONS = [
  "Electronics", "Fashion", "Home & Kitchen", "Books", "Sports & Fitness",
  "Beauty & Personal Care", "Toys & Games", "Food & Grocery", "Travel", "Other Deals",
];

const sections: Array<{ key: ReviewSection; label: string; color?: string }> = [
  { key: "all", label: "Flagged Deals", color: "orange" },
  { key: "telegram", label: "Telegram Scraped Deals", color: "blue" },
  { key: "missing_image", label: "Missing Image Deals", color: "red" },
  { key: "zero_price", label: "Zero Price Deals", color: "red" },
  { key: "price_mismatch", label: "Price Mismatch Deals", color: "yellow" },
  { key: "pending", label: "Pending Approval Deals", color: "gray" },
  { key: "approved", label: "Approved Deals", color: "green" },
  { key: "rejected", label: "Rejected Deals", color: "red" },
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

const ADMIN_SECRET_KEY = "enjoyfreedeals_admin_secret";

export default function AdminDashboard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const [fetchStatus, setFetchStatus] = useState("");
  const [section, setSection] = useState<ReviewSection>("all");
  const [editing, setEditing] = useState<FlaggedDeal | null>(null);
  const [form, setForm] = useState<EditForm>(emptyForm());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState<EditForm>(emptyForm());
  const [addStatus, setAddStatus] = useState<string>("pending_review");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [addImagePreview, setAddImagePreview] = useState<string>("");
  const [adminSecret, setAdminSecret] = useState<string>(() => localStorage.getItem(ADMIN_SECRET_KEY) || "");
  const [secretInput, setSecretInput] = useState("");
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-open secret dialog if secret is missing
  useEffect(() => {
    if (!localStorage.getItem(ADMIN_SECRET_KEY)) setSecretDialogOpen(true);
  }, []);

  const saveSecret = () => {
    const s = secretInput.trim();
    if (!s) return;
    localStorage.setItem(ADMIN_SECRET_KEY, s);
    setAdminSecret(s);
    setSecretDialogOpen(false);
    setSecretInput("");
    qc.invalidateQueries({ queryKey: ["admin-flagged-deals"] });
    toast({ title: "Admin secret saved", description: "Review data will now load." });
  };

  const clearSecret = () => {
    localStorage.removeItem(ADMIN_SECRET_KEY);
    setAdminSecret("");
    toast({ title: "Admin secret cleared" });
  };

  const { data, isLoading: reviewLoading, error: reviewError } = useQuery({
    queryKey: ["admin-flagged-deals", section, adminSecret],
    queryFn: () => fetchAdminFlaggedDeals(section),
    retry: false,
  });

  const { data: allReviewData } = useQuery({
    queryKey: ["admin-flagged-deals", "all", "telegram-section", adminSecret],
    queryFn: () => fetchAdminFlaggedDeals("all"),
    retry: false,
  });

  const items = data?.items || [];
  const summary = data?.summary;
  const telegramItems = useMemo(
    () => (allReviewData?.items || items).filter((item) => String(item.sourceType || "").includes("telegram")),
    [allReviewData?.items, items]
  );

  // Handle image file upload → convert to base64 data URL or hosted URL
  const handleImageFile = useCallback((file: File, setter: (url: string) => void, previewSetter: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = String(e.target?.result || "");
      previewSetter(dataUrl);
      setter(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("No deal selected.");
      return updateAdminDeal(editing.id, payloadFromForm(form));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-flagged-deals"] });
      toast({ title: "Deal updated" });
      setEditing(null);
      setImagePreview("");
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

  // Add new deal via Supabase
  const addDealMutation = useMutation({
    mutationFn: async () => {
      const slug = slugify(addForm.title);
      // Core columns that exist in all DB versions
      const payload: Record<string, unknown> = {
        title: addForm.title,
        slug,
        image_url: addForm.imageUrl || null,
        product_url: addForm.productUrl || null,
        affiliate_link: addForm.productUrl || null,
        description: addForm.description || null,
        coupon_code: addForm.couponCode || null,
        original_price: numericOrNull(addForm.originalPrice),
        discounted_price: numericOrNull(addForm.dealPrice),
        status: addStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Extended columns — added only if the value is set;
      // older DB versions without these columns will silently ignore them
      // after running the Fix Database migration.
      const extended: Record<string, unknown> = {
        availability: addForm.availability || null,
        admin_notes: addForm.adminNotes || null,
        price_range_min: numericOrNull(addForm.priceRangeMin),
        price_range_max: numericOrNull(addForm.priceRangeMax),
        source_type: sectionToSourceType(section),
        validation_flags: [],
        is_verified: addStatus === "active" || addStatus === "approved",
        is_featured: false,
      };

      // Try inserting with extended columns first; fall back to core-only on schema error
      let insertPayload = { ...payload, ...extended };

      // Look up store_id by name
      if (addForm.storeName) {
        const { data: storeRows } = await supabase
          .from("stores")
          .select("id")
          .ilike("name", addForm.storeName)
          .limit(1);
        if (storeRows && storeRows.length > 0) {
          insertPayload.store_id = storeRows[0].id;
        }
      }

      // Look up category_id by name
      if (addForm.categoryName) {
        const { data: catRows } = await supabase
          .from("categories")
          .select("id")
          .ilike("name", addForm.categoryName)
          .limit(1);
        if (catRows && catRows.length > 0) {
          insertPayload.category_id = catRows[0].id;
        }
      }

      let { error } = await supabase.from("deals").insert(insertPayload as any);

      // If schema error (missing column), retry with core columns only
      if (error && (error.message?.includes("column") || error.code === "PGRST204" || error.code === "42703")) {
        const fallback = await supabase.from("deals").insert(payload as any);
        if (fallback.error) throw fallback.error;
      } else if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-flagged-deals"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Deal added successfully" });
      setAddDialogOpen(false);
      setAddForm(emptyForm());
      setAddImagePreview("");
      setAddStatus("pending_review");
    },
    onError: (error: Error) => toast({ title: "Failed to add deal", description: error.message, variant: "destructive" }),
  });


  const openEdit = (deal: FlaggedDeal) => {
    setEditing(deal);
    setForm(formFromDeal(deal));
    setImagePreview(deal.imageUrl || "");
  };

  const openAddDeal = () => {
    setAddForm(emptyForm());
    setAddImagePreview("");
    setAddStatus("pending_review");
    setAddDialogOpen(true);
  };

  const cards = [
    { label: "Total Stores", value: stats?.totalStores, icon: Store },
    { label: "Total Clicks", value: stats?.totalClicks, icon: MousePointerClick },
    { label: "Activity Events", value: stats?.totalActivity, icon: Activity },
    { label: "Total Users", value: stats?.totalUsers, icon: Users },
  ];

  const currentSectionLabel = sections.find((s) => s.key === section)?.label || "Flagged Deals";

  return (
    <div className="space-y-7">
      <SEO title="Admin Dashboard - EnjoyFreeDeals" />

      {/* Admin Secret Setup Dialog */}
      <Dialog open={secretDialogOpen} onOpenChange={setSecretDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Enter Admin Secret
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The Admin API requires an <strong>ADMIN_API_SECRET</strong> to load deal review data.
            Enter it below — it will be saved in your browser.
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Paste admin secret here..."
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveSecret()}
              autoFocus
            />
            <Button onClick={saveSecret} disabled={!secretInput.trim()}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth error banner */}
      {reviewError && !adminSecret && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          <span className="text-destructive font-medium">⚠️ Admin API auth failed — please set your admin secret to load deal data.</span>
          <Button size="sm" variant="outline" onClick={() => { setSecretInput(""); setSecretDialogOpen(true); }}>
            <KeyRound className="mr-1 h-4 w-4" /> Set Secret
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">Deals review queue, Telegram monitor, and flagged deal controls.</p>
        </div>
        <div className="flex gap-2">
          {adminSecret && (
            <Button size="sm" variant="ghost" onClick={() => { setSecretInput(""); setSecretDialogOpen(true); }} title="Change admin secret">
              <KeyRound className="mr-1 h-4 w-4" />
              Secret
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            title="Fix missing database columns (admin_notes, availability, etc.)"
            onClick={async () => {
              try {
                const res = await fetch(`${window.location.origin}/api/admin/migrate`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(localStorage.getItem("enjoyfreedeals_admin_secret")
                      ? { "x-admin-secret": localStorage.getItem("enjoyfreedeals_admin_secret")! }
                      : {}),
                  },
                });
                const body = await res.json();
                toast({
                  title: res.ok ? "Database migration attempted" : "Migration failed",
                  description: res.ok
                    ? "Columns added or already existed. Try adding a deal now."
                    : (body?.message || "Could not run migration automatically. Run the SQL in Supabase SQL Editor."),
                  variant: res.ok ? "default" : "destructive",
                });
              } catch (e) {
                toast({ title: "Migration error", description: String(e), variant: "destructive" });
              }
            }}
          >
            🛠 Fix DB
          </Button>
          <Button size="sm" variant="outline" onClick={openAddDeal}>
            <Plus className="mr-1 h-4 w-4" />
            Add Deal
          </Button>
          <Button size="sm" asChild>
            <Link to="/admin/deals">
              <Tag className="mr-1 h-4 w-4" />
              Manage Deals
            </Link>
          </Button>
        </div>
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
          <CardTitle>Clicks &amp; Views (Last 7 Days)</CardTitle>
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

      {/* Section Filter Tabs */}
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

      {/* Current section deals table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">{currentSectionLabel}</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{items.length} rows</Badge>
            <Button size="sm" variant="outline" onClick={openAddDeal}>
              <Plus className="mr-1 h-4 w-4" />
              Add Deal
            </Button>
          </div>
        </div>
        <FlaggedDealsTable
          items={items}
          loading={reviewLoading}
          onEdit={openEdit}
          onApprove={(deal) => approveMutation.mutate(deal)}
          onReject={(deal) => rejectMutation.mutate(deal)}
        />
      </section>

      {/* Telegram-specific review section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Telegram Review Section</h2>
          <Badge variant="secondary">{telegramItems.length} rows</Badge>
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

      {/* ── Edit Deal Dialog ── */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) { setEditing(null); setImagePreview(""); } }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }} className="space-y-5">

            {/* Image preview + URL + file upload */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Deal Image</Label>
              {(imagePreview || form.imageUrl) && (
                <div className="flex justify-center">
                  <div className="relative h-40 w-40 overflow-hidden rounded-xl border border-border bg-secondary">
                    <img
                      src={imagePreview || form.imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Image URL</Label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={form.imageUrl}
                    onChange={(e) => {
                      setForm({ ...form, imageUrl: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file, (url) => setForm({ ...form, imageUrl: url }), setImagePreview);
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-1 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </div>
            </div>

            {/* Main fields grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
              <Field label="Product URL" value={form.productUrl} onChange={(value) => setForm({ ...form, productUrl: value })} />
              <Field label="Store name" value={form.storeName} onChange={(value) => setForm({ ...form, storeName: value })} />

              {/* Category dropdown */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.categoryName} onValueChange={(v) => setForm({ ...form, categoryName: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Field label="Coupon code" value={form.couponCode} onChange={(value) => setForm({ ...form, couponCode: value })} />
              <Field label="Availability" value={form.availability} onChange={(value) => setForm({ ...form, availability: value })} />
            </div>

            {/* Price section */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <Label className="text-base font-semibold">💰 Pricing</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Deal price (₹)" type="number" value={form.dealPrice} onChange={(value) => setForm({ ...form, dealPrice: value })} />
                <Field label="Original price (₹)" type="number" value={form.originalPrice} onChange={(value) => setForm({ ...form, originalPrice: value })} />
                <Field label="Price range min (₹)" type="number" value={form.priceRangeMin} onChange={(value) => setForm({ ...form, priceRangeMin: value })} />
                <Field label="Price range max (₹)" type="number" value={form.priceRangeMax} onChange={(value) => setForm({ ...form, priceRangeMax: value })} />
              </div>
              {(form.dealPrice || form.originalPrice) && (
                <div className="rounded-md bg-secondary p-3 text-sm">
                  <span className="font-bold text-primary">Deal Price: ₹{form.dealPrice || "—"}</span>
                  {form.originalPrice && (
                    <span className="ml-3 text-muted-foreground line-through">₹{form.originalPrice}</span>
                  )}
                  {form.dealPrice && form.originalPrice && Number(form.originalPrice) > 0 && (
                    <span className="ml-3 font-semibold text-green-600">
                      {Math.round(((Number(form.originalPrice) - Number(form.dealPrice)) / Number(form.originalPrice)) * 100)}% off
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={2}
                placeholder="Deal description..."
              />
            </div>

            {/* Admin notes */}
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

      {/* ── Add New Deal Dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) setAddImagePreview(""); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); addDealMutation.mutate(); }}
            className="space-y-5"
          >
            {/* Image section */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Deal Image</Label>
              {addImagePreview && (
                <div className="flex justify-center">
                  <div className="relative h-40 w-40 overflow-hidden rounded-xl border border-border bg-secondary">
                    <img
                      src={addImagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Image URL</Label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={addForm.imageUrl}
                    onChange={(e) => {
                      setAddForm({ ...addForm, imageUrl: e.target.value });
                      setAddImagePreview(e.target.value);
                    }}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <input
                    ref={addFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file, (url) => setAddForm({ ...addForm, imageUrl: url }), setAddImagePreview);
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => addFileInputRef.current?.click()}>
                    <Upload className="mr-1 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </div>
            </div>

            {/* Main fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  required
                  placeholder="Deal title..."
                />
              </div>
              <Field label="Product URL" value={addForm.productUrl} onChange={(v) => setAddForm({ ...addForm, productUrl: v })} />
              <Field label="Store name" value={addForm.storeName} onChange={(v) => setAddForm({ ...addForm, storeName: v })} />

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={addForm.categoryName} onValueChange={(v) => setAddForm({ ...addForm, categoryName: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={addStatus} onValueChange={setAddStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Field label="Coupon code" value={addForm.couponCode} onChange={(v) => setAddForm({ ...addForm, couponCode: v })} />
              <Field label="Availability" value={addForm.availability} onChange={(v) => setAddForm({ ...addForm, availability: v })} />
            </div>

            {/* Price */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <Label className="text-base font-semibold">💰 Pricing</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Deal price (₹)" type="number" value={addForm.dealPrice} onChange={(v) => setAddForm({ ...addForm, dealPrice: v })} />
                <Field label="Original price (₹)" type="number" value={addForm.originalPrice} onChange={(v) => setAddForm({ ...addForm, originalPrice: v })} />
                <Field label="Price range min (₹)" type="number" value={addForm.priceRangeMin} onChange={(v) => setAddForm({ ...addForm, priceRangeMin: v })} />
                <Field label="Price range max (₹)" type="number" value={addForm.priceRangeMax} onChange={(v) => setAddForm({ ...addForm, priceRangeMax: v })} />
              </div>
              {(addForm.dealPrice || addForm.originalPrice) && (
                <div className="rounded-md bg-secondary p-3 text-sm">
                  <span className="font-bold text-primary">Deal Price: ₹{addForm.dealPrice || "—"}</span>
                  {addForm.originalPrice && (
                    <span className="ml-3 text-muted-foreground line-through">₹{addForm.originalPrice}</span>
                  )}
                  {addForm.dealPrice && addForm.originalPrice && Number(addForm.originalPrice) > 0 && (
                    <span className="ml-3 font-semibold text-green-600">
                      {Math.round(((Number(addForm.originalPrice) - Number(addForm.dealPrice)) / Number(addForm.originalPrice)) * 100)}% off
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                rows={3}
                placeholder="Describe the deal..."
              />
            </div>

            {/* Admin notes */}
            <div className="space-y-2">
              <Label>Admin notes</Label>
              <Textarea
                value={addForm.adminNotes}
                onChange={(e) => setAddForm({ ...addForm, adminNotes: e.target.value })}
                rows={2}
                placeholder="Internal notes..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addDealMutation.isPending || !addForm.title}>
                {addDealMutation.isPending ? "Adding..." : "Add Deal"}
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
            {!compact && <TableHead>Discount</TableHead>}
            <TableHead>Flags</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={compact ? 6 : 10} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
          ) : items.length === 0 ? (
            <TableRow><TableCell colSpan={compact ? 6 : 10} className="py-8 text-center text-muted-foreground">No deals in this queue.</TableCell></TableRow>
          ) : items.map((deal) => {
            const discount = deal.dealPrice && deal.originalPrice && deal.originalPrice > 0
              ? Math.round(((deal.originalPrice - deal.dealPrice) / deal.originalPrice) * 100)
              : null;
            return (
              <TableRow key={deal.id}>
                <TableCell>
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-secondary">
                    {deal.imageUrl ? (
                      <img src={deal.imageUrl} alt={deal.title} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <ImageOff className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-[220px]">
                  <div className="line-clamp-2 font-medium">{deal.title || "Untitled deal"}</div>
                  <div className="truncate text-xs text-muted-foreground">{deal.productUrl || "No product URL"}</div>
                  {deal.couponCode && (
                    <Badge variant="outline" className="mt-1 text-xs">{deal.couponCode}</Badge>
                  )}
                </TableCell>
                {!compact && <TableCell className="text-sm">{deal.storeName || "—"}</TableCell>}
                {!compact && <TableCell className="text-sm">{deal.categoryName || "Other Deals"}</TableCell>}
                <TableCell>
                  <span className="font-semibold text-primary">{formatMoney(deal.dealPrice)}</span>
                </TableCell>
                {!compact && (
                  <TableCell>
                    <span className="text-muted-foreground line-through text-sm">{formatMoney(deal.originalPrice)}</span>
                  </TableCell>
                )}
                {!compact && (
                  <TableCell>
                    {discount !== null && discount > 0 ? (
                      <Badge variant="secondary" className="text-green-600 bg-green-50 text-xs">{discount}% off</Badge>
                    ) : "—"}
                  </TableCell>
                )}
                <TableCell className="max-w-[200px]">
                  <div className="flex flex-wrap gap-1">
                    {deal.flags.slice(0, compact ? 2 : 5).map((flag) => (
                      <Badge key={flag} variant={flag.includes("price") || flag.includes("image") ? "destructive" : "secondary"} className="text-xs">
                        {flag.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={deal.status === "approved" || deal.status === "active" ? "default" : "secondary"}>{deal.status}</Badge>
                </TableCell>
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
            );
          })}
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
    description: "",
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
  if (value === null || value === undefined) return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
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

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "deal";
}

function sectionToSourceType(section: ReviewSection): string | null {
  if (section === "telegram") return "telegram";
  return null;
}
