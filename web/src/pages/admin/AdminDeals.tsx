import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import AmazonLookupButton from "@/components/admin/AmazonLookupButton";
import { useToast } from "@/hooks/use-toast";
import { useStores } from "@/hooks/useStores";
import { useCategories } from "@/hooks/useCategories";
import SEO from "@/components/SEO";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Deal = Tables<"deals">;

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const emptyDeal: Partial<TablesInsert<"deals">> = {
  title: "", slug: "", store_id: "", category_id: "", description: "",
  original_price: undefined, discounted_price: undefined, coupon_code: "",
  affiliate_link: "", image_url: "", status: "active", is_featured: false, is_verified: false,
};

export default function AdminDeals() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [form, setForm] = useState<Partial<TablesInsert<"deals">>>(emptyDeal);

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["admin-deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*, stores(name), categories(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: stores = [] } = useStores();
  const { data: categories = [] } = useCategories();

  const saveMutation = useMutation({
    mutationFn: async (deal: Partial<TablesInsert<"deals">>) => {
      const payload = { ...deal, slug: deal.slug || slugify(deal.title || "") };
      if (editing) {
        const { error } = await supabase.from("deals").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("deals").insert(payload as TablesInsert<"deals">);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-deals"] });
      toast({ title: editing ? "Deal updated" : "Deal created" });
      setOpen(false);
      setEditing(null);
      setForm(emptyDeal);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-deals"] }); toast({ title: "Deal deleted" }); },
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from("deals").update({ is_featured: val }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-deals"] }),
  });

  const openEdit = (deal: Deal) => {
    setEditing(deal);
    setForm({
      title: deal.title, slug: deal.slug, store_id: deal.store_id, category_id: deal.category_id ?? "",
      description: deal.description ?? "", original_price: deal.original_price ?? undefined,
      discounted_price: deal.discounted_price ?? undefined, coupon_code: deal.coupon_code ?? "",
      affiliate_link: deal.affiliate_link ?? "", image_url: deal.image_url ?? "",
      status: deal.status ?? "active", is_featured: deal.is_featured ?? false, is_verified: deal.is_verified ?? false,
    });
    setOpen(true);
  };

  const openNew = () => { setEditing(null); setForm(emptyDeal); setOpen(true); };

  return (
    <div className="space-y-6">
      <SEO title="Manage Deals – Admin" />
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Deals</h1>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" />Add Deal</Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Store</TableHead>
              <TableHead className="hidden lg:table-cell">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Featured</TableHead>
              <TableHead className="hidden md:table-cell">Clicks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : deals.map((deal: any) => (
              <TableRow key={deal.id}>
                <TableCell className="font-medium max-w-[200px] truncate">{deal.title}</TableCell>
                <TableCell className="hidden md:table-cell">{deal.stores?.name ?? "—"}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  {deal.discounted_price != null ? `₹${deal.discounted_price}` : "—"}
                  {deal.original_price != null && <span className="ml-1 text-xs text-muted-foreground line-through">₹{deal.original_price}</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={deal.status === "active" ? "default" : "secondary"}>{deal.status}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Switch checked={deal.is_featured ?? false} onCheckedChange={(val) => toggleFeatured.mutate({ id: deal.id, val })} />
                </TableCell>
                <TableCell className="hidden md:table-cell">{deal.click_count ?? 0}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(deal)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete deal?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deal.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Deal" : "New Deal"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <AmazonLookupButton onResult={(p) => setForm((f) => ({
              ...f,
              title: p.title || f.title,
              slug: p.title ? slugify(p.title) : f.slug,
              image_url: p.image_url || f.image_url,
              description: p.description || f.description,
              original_price: p.original_price ?? f.original_price,
              discounted_price: p.discounted_price ?? f.discounted_price,
            }))} />
            <div className="space-y-2"><Label>Title</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} required /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Store</Label>
                <Select value={form.store_id ?? ""} onValueChange={(v) => setForm({ ...form, store_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                  <SelectContent>{stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id ?? ""} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Original Price</Label><Input type="number" value={form.original_price ?? ""} onChange={(e) => setForm({ ...form, original_price: e.target.value ? +e.target.value : undefined })} /></div>
              <div className="space-y-2"><Label>Discounted Price</Label><Input type="number" value={form.discounted_price ?? ""} onChange={(e) => setForm({ ...form, discounted_price: e.target.value ? +e.target.value : undefined })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Coupon Code</Label><Input value={form.coupon_code ?? ""} onChange={(e) => setForm({ ...form, coupon_code: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status ?? "active"} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Affiliate Link</Label><Input value={form.affiliate_link ?? ""} onChange={(e) => setForm({ ...form, affiliate_link: e.target.value })} /></div>
            <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_featured ?? false} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />Featured</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_verified ?? false} onCheckedChange={(v) => setForm({ ...form, is_verified: v })} />Verified</label>
            </div>
            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : "Save Deal"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
