import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckCircle, Trash2, Search, Webhook, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStores } from "@/hooks/useStores";
import { useCategories } from "@/hooks/useCategories";
import AmazonLookupButton from "@/components/admin/AmazonLookupButton";
import SEO from "@/components/SEO";
import { format } from "date-fns";

const emptyForm = {
  title: "", description: "", original_price: undefined as number | undefined,
  discounted_price: undefined as number | undefined, coupon_code: "",
  affiliate_link: "", image_url: "", status: "active" as string,
  is_featured: false, is_verified: false, store_id: "", category_id: "",
};

export default function AdminWebhookDeals() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: stores = [] } = useStores();
  const { data: categories = [] } = useCategories();

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["admin-webhook-deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, stores(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).filter((d: any) => d.source === "webhook");
    },
  });

  const filtered = deals.filter((d: any) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalCount = deals.length;
  const activeCount = deals.filter((d: any) => d.status === "active").length;
  const unverifiedCount = deals.filter((d: any) => !d.is_verified).length;

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").update({ is_verified: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-webhook-deals"] });
      toast({ title: "Deal verified" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-webhook-deals"] });
      toast({ title: "Deal deleted" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase.from("deals").update({
        title: form.title,
        description: form.description || null,
        original_price: form.original_price ?? null,
        discounted_price: form.discounted_price ?? null,
        coupon_code: form.coupon_code || null,
        affiliate_link: form.affiliate_link || null,
        image_url: form.image_url || null,
        status: form.status as any,
        is_featured: form.is_featured,
        is_verified: form.is_verified,
        store_id: form.store_id,
        category_id: form.category_id || null,
      }).eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-webhook-deals"] });
      toast({ title: "Deal updated" });
      setEditOpen(false);
      setEditingId(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (deal: any) => {
    setEditingId(deal.id);
    setForm({
      title: deal.title ?? "",
      description: deal.description ?? "",
      original_price: deal.original_price ?? undefined,
      discounted_price: deal.discounted_price ?? undefined,
      coupon_code: deal.coupon_code ?? "",
      affiliate_link: deal.affiliate_link ?? "",
      image_url: deal.image_url ?? "",
      status: deal.status ?? "active",
      is_featured: deal.is_featured ?? false,
      is_verified: deal.is_verified ?? false,
      store_id: deal.store_id ?? "",
      category_id: deal.category_id ?? "",
    });
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <SEO title="Webhook Deals – Admin" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold">Webhook Deals</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{totalCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-primary">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Unverified</p>
          <p className="text-2xl font-bold text-destructive">{unverifiedCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Store</TableHead>
              <TableHead className="hidden lg:table-cell">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Verified</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No webhook deals found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((deal: any) => (
                <TableRow key={deal.id}>
                  <TableCell className="max-w-[200px] truncate font-medium">{deal.title}</TableCell>
                  <TableCell className="hidden md:table-cell">{deal.stores?.name ?? "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {deal.discounted_price != null ? `₹${deal.discounted_price}` : "—"}
                    {deal.original_price != null && (
                      <span className="ml-1 text-xs text-muted-foreground line-through">₹{deal.original_price}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={deal.status === "active" ? "default" : "secondary"}>{deal.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={deal.is_verified ? "default" : "outline"}>
                      {deal.is_verified ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {format(new Date(deal.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(deal)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!deal.is_verified && (
                        <Button variant="ghost" size="icon" title="Verify" onClick={() => verifyMutation.mutate(deal.id)}>
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete deal?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(deal.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Deal</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
            <AmazonLookupButton onResult={(p) => setForm((f) => ({
              ...f,
              title: p.title || f.title,
              image_url: p.image_url || f.image_url,
              description: p.description || f.description,
              original_price: p.original_price ?? f.original_price,
              discounted_price: p.discounted_price ?? f.discounted_price,
            }))} />
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Store</Label>
                <Select value={form.store_id} onValueChange={(v) => setForm({ ...form, store_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                  <SelectContent>{stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Original Price</Label><Input type="number" value={form.original_price ?? ""} onChange={(e) => setForm({ ...form, original_price: e.target.value ? +e.target.value : undefined })} /></div>
              <div className="space-y-2"><Label>Discounted Price</Label><Input type="number" value={form.discounted_price ?? ""} onChange={(e) => setForm({ ...form, discounted_price: e.target.value ? +e.target.value : undefined })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Coupon Code</Label><Input value={form.coupon_code} onChange={(e) => setForm({ ...form, coupon_code: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Affiliate Link</Label><Input value={form.affiliate_link} onChange={(e) => setForm({ ...form, affiliate_link: e.target.value })} /></div>
            <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />Featured</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_verified} onCheckedChange={(v) => setForm({ ...form, is_verified: v })} />Verified</label>
            </div>
            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving…" : "Save Changes"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
