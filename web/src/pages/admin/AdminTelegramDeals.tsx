import { type ReactNode, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Clock, ExternalLink, ImageOff, MessageCircle, Pencil, XCircle } from "lucide-react";
import { format } from "date-fns";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  approveAdminDeal,
  expireAdminTelegramDeal,
  fetchAdminTelegramDeals,
  fetchAdminTelegramScrapeLogs,
  rejectAdminDeal,
  updateAdminTelegramManualExpiry,
  updateAdminTelegramManualPrice,
  type AdminTelegramScrapeLog,
  type BackendDeal,
} from "@/lib/api";

type ReviewSection = "all" | "price" | "expiry" | "expired" | "failed";

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
  const [editingPrice, setEditingPrice] = useState<BackendDeal | null>(null);
  const [editingExpiry, setEditingExpiry] = useState<BackendDeal | null>(null);
  const [priceForm, setPriceForm] = useState({ min: "", max: "", note: "" });
  const [expiryForm, setExpiryForm] = useState({ expiryAt: "", note: "" });

  const dealsQuery = useQuery({
    queryKey: ["admin-telegram-deals", section],
    enabled: section !== "failed",
    queryFn: () => fetchAdminTelegramDeals(section),
    retry: false,
  });

  const logsQuery = useQuery({
    queryKey: ["admin-telegram-scrape-logs"],
    enabled: section === "failed",
    queryFn: fetchAdminTelegramScrapeLogs,
    retry: false,
  });

  const counts = useMemo(() => {
    const deals = dealsQuery.data || [];
    return {
      price: deals.filter((deal) => priceStatus(deal) === "manual_required" || !hasPositiveDealPrice(deal)).length,
      expiry: deals.filter((deal) => expiryStatus(deal) === "manual_required").length,
      expired: deals.filter((deal) => isExpiredDeal(deal)).length,
    };
  }, [dealsQuery.data]);

  const manualPriceMutation = useMutation({
    mutationFn: async () => {
      if (!editingPrice) return null;
      return updateAdminTelegramManualPrice(editingPrice.id, {
        priceMin: priceForm.min ? Number(priceForm.min) : null,
        priceMax: priceForm.max ? Number(priceForm.max) : null,
        manualPriceNote: priceForm.note || "Price range added by admin.",
      });
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
      if (!editingExpiry) return null;
      return updateAdminTelegramManualExpiry(editingExpiry.id, {
        expiryAt: new Date(expiryForm.expiryAt).toISOString(),
        expiryNote: expiryForm.note || "Expiry added by admin.",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-telegram-deals"] });
      toast({ title: "Expiry saved" });
      setEditingExpiry(null);
    },
    onError: (error: Error) => toast({ title: "Expiry update failed", description: error.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ deal, status }: { deal: BackendDeal; status: "active" | "rejected" | "expired" }) => {
      if (status === "active") {
        return approveAdminDeal(deal.id, { allowMissingImage: true, allowFlags: true });
      }
      if (status === "expired") {
        return expireAdminTelegramDeal(deal.id, "Marked expired in Telegram review.");
      }
      return rejectAdminDeal(deal.id, "Rejected in Telegram review.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-telegram-deals"] });
      toast({ title: "Deal status updated" });
    },
    onError: (error: Error) => toast({ title: "Status update failed", description: error.message, variant: "destructive" }),
  });

  const openPriceDialog = (deal: BackendDeal) => {
    setEditingPrice(deal);
    setPriceForm({
      min: numberString(deal.priceMin ?? deal.price_min),
      max: numberString(deal.priceMax ?? deal.price_max),
      note: deal.manualPriceNote || deal.manual_price_note || "",
    });
  };

  const openExpiryDialog = (deal: BackendDeal) => {
    setEditingExpiry(deal);
    const value = expiryAt(deal) ? new Date(expiryAt(deal) || "").toISOString().slice(0, 16) : "";
    setExpiryForm({ expiryAt: value, note: deal.expiryNote || deal.expiry_note || "" });
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
            onApprove={(deal) => statusMutation.mutate({ deal, status: "active" })}
            onReject={(deal) => statusMutation.mutate({ deal, status: "rejected" })}
            onExpire={(deal) => statusMutation.mutate({ deal, status: "expired" })}
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
  deals: BackendDeal[];
  loading: boolean;
  onEditPrice: (deal: BackendDeal) => void;
  onEditExpiry: (deal: BackendDeal) => void;
  onApprove: (deal: BackendDeal) => void;
  onReject: (deal: BackendDeal) => void;
  onExpire: (deal: BackendDeal) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Image</TableHead>
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
          <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
        ) : deals.length === 0 ? (
          <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No Telegram deals found.</TableCell></TableRow>
        ) : deals.map((deal) => (
          <TableRow key={deal.id}>
            <TableCell>
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-secondary">
                {dealImageUrl(deal) ? (
                  <img src={dealImageUrl(deal)} alt={deal.title} className="h-full w-full object-cover" onError={(event) => { (event.currentTarget as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <ImageOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </TableCell>
            <TableCell className="max-w-[280px]">
              <div className="line-clamp-2 font-medium">{deal.title || "Untitled deal"}</div>
              <div className="truncate text-xs text-muted-foreground">{dealProductUrl(deal) || "No product URL"}</div>
              {deal.slug && (
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                  <Link to={`/deals/${deal.slug}`}>Deal page <ExternalLink className="ml-1 h-3 w-3" /></Link>
                </Button>
              )}
            </TableCell>
            <TableCell>{sourceChannel(deal) || "-"}</TableCell>
            <TableCell><PriceCell deal={deal} /></TableCell>
            <TableCell><ExpiryCell deal={deal} /></TableCell>
            <TableCell><Badge variant={deal.status === "active" || deal.status === "approved" ? "default" : "secondary"}>{deal.status || adminReviewStatus(deal) || "-"}</Badge></TableCell>
            <TableCell className="text-right">
              <div className="flex flex-wrap justify-end gap-1">
                <Button variant="ghost" size="icon" title="Edit price" onClick={() => onEditPrice(deal)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Edit expiry" onClick={() => onEditExpiry(deal)}><Clock className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Approve" onClick={() => onApprove(deal)}><CheckCircle className="h-4 w-4 text-primary" /></Button>
                <Button variant="ghost" size="icon" title="Reject" onClick={() => onReject(deal)}><XCircle className="h-4 w-4 text-destructive" /></Button>
                <Button variant="outline" size="sm" onClick={() => onExpire(deal)}>Expire</Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PriceCell({ deal }: { deal: BackendDeal }) {
  const min = numberOrNull(deal.priceMin ?? deal.price_min);
  const max = numberOrNull(deal.priceMax ?? deal.price_max);
  const hasRange = min !== null || max !== null;

  if (priceStatus(deal) === "manual_required" || (!hasPositiveDealPrice(deal) && !hasRange)) {
    return <Badge variant="destructive">Needs price</Badge>;
  }

  if (min !== null || max !== null) {
    return <span>{formatMoney(min ?? max)} - {formatMoney(max ?? min)}</span>;
  }

  return <span>{formatMoney(dealPrice(deal))}</span>;
}

function ExpiryCell({ deal }: { deal: BackendDeal }) {
  if (expiryStatus(deal) === "manual_required") {
    return <Badge variant="outline">Needs expiry</Badge>;
  }

  const value = expiryAt(deal);
  return value ? <span>{format(new Date(value), "dd MMM yyyy, h:mm a")}</span> : <span>Expiry not confirmed</span>;
}

function ScrapeLogsTable({ logs, loading }: { logs: AdminTelegramScrapeLog[]; loading: boolean }) {
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
        ) : logs.map((log) => {
          const status = log.scrapeStatus || log.scrape_status || "";
          const createdAt = log.createdAt || log.created_at || "";
          return (
            <TableRow key={log.id}>
              <TableCell>{log.sourceChannel || log.source_channel || "-"}</TableCell>
              <TableCell>{log.telegramMessageId || log.telegram_message_id || "-"}</TableCell>
              <TableCell><Badge variant={status === "failed" ? "destructive" : "secondary"}>{status || "-"}</Badge></TableCell>
              <TableCell className="max-w-[360px] truncate">{log.errorMessage || log.error_message || log.messageText || log.message_text || "-"}</TableCell>
              <TableCell>{createdAt ? format(new Date(createdAt), "dd MMM yyyy, h:mm a") : "-"}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function hasPositiveDealPrice(deal: BackendDeal) {
  const price = dealPrice(deal);
  return price !== null && price > 0;
}

function dealPrice(deal: BackendDeal) {
  return numberOrNull(deal.dealPrice ?? deal.discountedPrice ?? deal.discounted_price ?? deal.deal_price);
}

function dealImageUrl(deal: BackendDeal) {
  return firstHttpUrl(deal.imageUrl, deal.image_url, deal.finalImageUrl, deal.final_image_url, deal.sourceImageUrl, deal.source_image_url);
}

function dealProductUrl(deal: BackendDeal) {
  return firstHttpUrl(deal.productUrl, deal.dealUrl, deal.affiliateUrl, deal.affiliate_link, deal.source_url, deal.platformProductUrl, deal.platform_product_url);
}

function priceStatus(deal: BackendDeal) {
  return deal.priceStatus || deal.price_status || "";
}

function expiryStatus(deal: BackendDeal) {
  return deal.expiryStatus || deal.expiry_status || "";
}

function expiryAt(deal: BackendDeal) {
  return deal.expiryAt || deal.expiry_at || deal.platformExpiresAt || null;
}

function sourceChannel(deal: BackendDeal) {
  return deal.sourceChannel || deal.source_channel || "";
}

function adminReviewStatus(deal: BackendDeal) {
  return deal.adminReviewStatus || deal.admin_review_status || "";
}

function isExpiredDeal(deal: BackendDeal) {
  return Boolean(deal.isExpired || deal.is_expired || deal.status === "expired");
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function numberString(value: unknown) {
  const numeric = numberOrNull(value);
  return numeric === null ? "" : String(numeric);
}

function formatMoney(value: number | null) {
  return value === null ? "-" : `Rs.${Number(value).toLocaleString("en-IN")}`;
}

function firstHttpUrl(...values: Array<string | null | undefined>) {
  return values.map((value) => String(value || "").trim()).find((value) => /^https?:\/\//i.test(value)) || "";
}
