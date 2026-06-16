import { type ReactNode, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Clock, MessageCircle, Pencil, XCircle } from "lucide-react";
import { format } from "date-fns";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type ReviewSection = "all" | "price" | "expiry" | "expired" | "failed";

type TelegramDeal = {
  id: string;
  title: string;
  discounted_price: number | null;
  original_price: number | null;
  price_status: string | null;
  price_min: number | null;
  price_max: number | null;
  manual_price_note: string | null;
  expiry_status: string | null;
  expiry_at: string | null;
  expiry_note: string | null;
  source_channel: string | null;
  telegram_channel: string | null;
  telegram_message_id: string | null;
  admin_review_status: string | null;
  status: string | null;
  is_expired: boolean | null;
  scrape_status: string | null;
  last_scraped_at: string | null;
  created_at: string;
};

type ScrapeLog = {
  id: string;
  source_channel: string | null;
  telegram_message_id: string | null;
  scrape_status: string;
  error_message: string | null;
  message_text: string | null;
  created_at: string;
};

const sections: Array<{ key: ReviewSection; label: string }> = [
  { key: "all", label: "Telegram Scraped Deals" },
  { key: "price", label: "Needs Price Review" },
  { key: "expiry", label: "Needs Expiry Review" },
  { key: "expired", label: "Expired Deals" },
  { key: "failed", label: "Failed Scrape Logs" },
];

export default function AdminTelegramDeals() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [section, setSection] = useState<ReviewSection>("all");
  const [editingPrice, setEditingPrice] = useState<TelegramDeal | null>(null);
  const [editingExpiry, setEditingExpiry] = useState<TelegramDeal | null>(null);
  const [priceForm, setPriceForm] = useState({ min: "", max: "", note: "" });
  const [expiryForm, setExpiryForm] = useState({ expiryAt: "", note: "" });

  const dealsQuery = useQuery({
    queryKey: ["admin-telegram-deals", section],
    enabled: section !== "failed",
    queryFn: async () => {
      let query = supabase
        .from("deals")
        .select("*")
        .or("source_type.eq.telegram,telegram_channel.not.is.null,source_channel.not.is.null")
        .order("last_scraped_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (section === "price") query = query.eq("price_status", "manual_required");
      if (section === "expiry") query = query.eq("expiry_status", "manual_required");
      if (section === "expired") query = query.or("is_expired.eq.true,status.eq.expired");

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as TelegramDeal[];
    },
  });

  const logsQuery = useQuery({
    queryKey: ["admin-telegram-scrape-logs"],
    enabled: section === "failed",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scrape_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as ScrapeLog[];
    },
  });

  const counts = useMemo(() => {
    const deals = dealsQuery.data || [];
    return {
      price: deals.filter((deal) => deal.price_status === "manual_required").length,
      expiry: deals.filter((deal) => deal.expiry_status === "manual_required").length,
      expired: deals.filter((deal) => deal.is_expired || deal.status === "expired").length,
    };
  }, [dealsQuery.data]);

  const manualPriceMutation = useMutation({
    mutationFn: async () => {
      if (!editingPrice) return;
      const priceMin = priceForm.min ? Number(priceForm.min) : null;
      const priceMax = priceForm.max ? Number(priceForm.max) : null;
      const activePrice = priceMin ?? priceMax ?? 0;
      const { error } = await supabase.from("deals").update({
        price_min: priceMin,
        price_max: priceMax,
        manual_price_note: priceForm.note || "Price range added by admin.",
        price_status: "manual_added",
        admin_review_status: "approved",
        discounted_price: activePrice,
        original_price: priceMax ?? priceMin,
        status: "active",
        is_verified: true,
        updated_at: new Date().toISOString(),
      }).eq("id", editingPrice.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-telegram-deals"] });
      toast({ title: "Price range saved" });
      setEditingPrice(null);
    },
    onError: (error: Error) => toast({ title: "Price update failed", description: error.message, variant: "destructive" }),
  });

  const manualExpiryMutation = useMutation({
    mutationFn: async () => {
      if (!editingExpiry) return;
      const expiryAt = expiryForm.expiryAt ? new Date(expiryForm.expiryAt).toISOString() : null;
      const expired = expiryAt ? new Date(expiryAt).getTime() <= Date.now() : false;
      const { error } = await supabase.from("deals").update({
        expiry_at: expiryAt,
        expiry_date: expiryAt,
        platform_expires_at: expiryAt,
        expiry_note: expiryForm.note || "Expiry added by admin.",
        expiry_status: "manual_added",
        admin_review_status: "approved",
        is_expired: expired,
        status: expired ? "expired" : "active",
        is_verified: !expired,
        updated_at: new Date().toISOString(),
      }).eq("id", editingExpiry.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-telegram-deals"] });
      toast({ title: "Expiry saved" });
      setEditingExpiry(null);
    },
    onError: (error: Error) => toast({ title: "Expiry update failed", description: error.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "rejected" | "expired" }) => {
      const { error } = await supabase.from("deals").update({
        status,
        is_verified: status === "active",
        is_expired: status === "expired",
        admin_review_status: status === "active" ? "approved" : status,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-telegram-deals"] });
      toast({ title: "Deal status updated" });
    },
    onError: (error: Error) => toast({ title: "Status update failed", description: error.message, variant: "destructive" }),
  });

  const openPriceDialog = (deal: TelegramDeal) => {
    setEditingPrice(deal);
    setPriceForm({
      min: deal.price_min?.toString() || "",
      max: deal.price_max?.toString() || "",
      note: deal.manual_price_note || "",
    });
  };

  const openExpiryDialog = (deal: TelegramDeal) => {
    setEditingExpiry(deal);
    const value = deal.expiry_at ? new Date(deal.expiry_at).toISOString().slice(0, 16) : "";
    setExpiryForm({ expiryAt: value, note: deal.expiry_note || "" });
  };

  const deals = dealsQuery.data || [];
  const logs = logsQuery.data || [];
  const loading = section === "failed" ? logsQuery.isLoading : dealsQuery.isLoading;

  return (
    <div className="space-y-6">
      <SEO title="Telegram Deals - Admin" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold">Telegram Deal Review</h1>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Needs Price Review" value={counts.price} icon={<AlertTriangle className="h-4 w-4" />} />
        <MetricCard label="Needs Expiry Review" value={counts.expiry} icon={<Clock className="h-4 w-4" />} />
        <MetricCard label="Expired Deals" value={counts.expired} icon={<XCircle className="h-4 w-4" />} />
      </div>

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

      <div className="rounded-lg border border-border">
        {section === "failed" ? (
          <ScrapeLogsTable logs={logs} loading={loading} />
        ) : (
          <DealsTable
            deals={deals}
            loading={loading}
            onEditPrice={openPriceDialog}
            onEditExpiry={openExpiryDialog}
            onApprove={(id) => statusMutation.mutate({ id, status: "active" })}
            onReject={(id) => statusMutation.mutate({ id, status: "rejected" })}
            onExpire={(id) => statusMutation.mutate({ id, status: "expired" })}
          />
        )}
      </div>

      <Dialog open={Boolean(editingPrice)} onOpenChange={(open) => !open && setEditingPrice(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Price Range</DialogTitle></DialogHeader>
          <form onSubmit={(event) => { event.preventDefault(); manualPriceMutation.mutate(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Price Min</Label><Input type="number" min="0" value={priceForm.min} onChange={(event) => setPriceForm({ ...priceForm, min: event.target.value })} /></div>
              <div className="space-y-2"><Label>Price Max</Label><Input type="number" min="0" value={priceForm.max} onChange={(event) => setPriceForm({ ...priceForm, max: event.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Manual Price Note</Label><Textarea value={priceForm.note} onChange={(event) => setPriceForm({ ...priceForm, note: event.target.value })} /></div>
            <Button type="submit" className="w-full" disabled={manualPriceMutation.isPending}>Save Price Range</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingExpiry)} onOpenChange={(open) => !open && setEditingExpiry(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expiry Details</DialogTitle></DialogHeader>
          <form onSubmit={(event) => { event.preventDefault(); manualExpiryMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2"><Label>Expiry Date & Time</Label><Input type="datetime-local" value={expiryForm.expiryAt} onChange={(event) => setExpiryForm({ ...expiryForm, expiryAt: event.target.value })} required /></div>
            <div className="space-y-2"><Label>Expiry Note</Label><Textarea value={expiryForm.note} onChange={(event) => setExpiryForm({ ...expiryForm, note: event.target.value })} /></div>
            <Button type="submit" className="w-full" disabled={manualExpiryMutation.isPending}>Save Expiry</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function DealsTable({ deals, loading, onEditPrice, onEditExpiry, onApprove, onReject, onExpire }: {
  deals: TelegramDeal[];
  loading: boolean;
  onEditPrice: (deal: TelegramDeal) => void;
  onEditExpiry: (deal: TelegramDeal) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onExpire: (id: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Deal</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
        ) : deals.length === 0 ? (
          <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No Telegram deals found.</TableCell></TableRow>
        ) : deals.map((deal) => (
          <TableRow key={deal.id}>
            <TableCell className="max-w-[260px]">
              <div className="truncate font-medium">{deal.title}</div>
              <div className="text-xs text-muted-foreground">Message {deal.telegram_message_id || "-"}</div>
            </TableCell>
            <TableCell>{deal.source_channel || deal.telegram_channel || "-"}</TableCell>
            <TableCell>
              {deal.price_status === "manual_required" ? (
                <Badge variant="destructive">Needs price</Badge>
              ) : deal.price_min || deal.price_max ? (
                <span>₹{deal.price_min ?? deal.price_max} - ₹{deal.price_max ?? deal.price_min}</span>
              ) : (
                <span>₹{deal.discounted_price ?? 0}</span>
              )}
            </TableCell>
            <TableCell>
              {deal.expiry_status === "manual_required" ? (
                <Badge variant="outline">Needs expiry</Badge>
              ) : deal.expiry_at ? (
                <span>{format(new Date(deal.expiry_at), "dd MMM yyyy, h:mm a")}</span>
              ) : "Expiry not confirmed"}
            </TableCell>
            <TableCell><Badge variant={deal.status === "active" ? "default" : "secondary"}>{deal.status || deal.admin_review_status}</Badge></TableCell>
            <TableCell className="text-right">
              <div className="flex flex-wrap justify-end gap-1">
                <Button variant="ghost" size="icon" title="Edit price" onClick={() => onEditPrice(deal)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Edit expiry" onClick={() => onEditExpiry(deal)}><Clock className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Approve" onClick={() => onApprove(deal.id)}><CheckCircle className="h-4 w-4 text-primary" /></Button>
                <Button variant="ghost" size="icon" title="Reject" onClick={() => onReject(deal.id)}><XCircle className="h-4 w-4 text-destructive" /></Button>
                <Button variant="outline" size="sm" onClick={() => onExpire(deal.id)}>Expire</Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ScrapeLogsTable({ logs, loading }: { logs: ScrapeLog[]; loading: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Channel</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Error</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
        ) : logs.length === 0 ? (
          <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No failed scrape logs found.</TableCell></TableRow>
        ) : logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{log.source_channel || "-"}</TableCell>
            <TableCell>{log.telegram_message_id || "-"}</TableCell>
            <TableCell><Badge variant={log.scrape_status === "failed" ? "destructive" : "secondary"}>{log.scrape_status}</Badge></TableCell>
            <TableCell className="max-w-[360px] truncate">{log.error_message || log.message_text || "-"}</TableCell>
            <TableCell>{format(new Date(log.created_at), "dd MMM yyyy, h:mm a")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
