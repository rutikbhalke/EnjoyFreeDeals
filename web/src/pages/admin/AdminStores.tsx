import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type StoreRow = Tables<"stores">;

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

const empty: Partial<TablesInsert<"stores">> = {
  name: "", slug: "", description: "", logo_url: "", website_url: "", affiliate_base_url: "", cashback_percentage: 0, is_active: true,
};

export default function AdminStores() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StoreRow | null>(null);
  const [form, setForm] = useState<Partial<TablesInsert<"stores">>>(empty);

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ["admin-stores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (s: Partial<TablesInsert<"stores">>) => {
      const payload = { ...s, slug: s.slug || slugify(s.name || "") };
      if (editing) {
        const { error } = await supabase.from("stores").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("stores").insert(payload as TablesInsert<"stores">);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-stores"] }); toast({ title: editing ? "Store updated" : "Store created" }); setOpen(false); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("stores").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-stores"] }); toast({ title: "Store deleted" }); },
  });

  const openEdit = (s: StoreRow) => {
    setEditing(s);
    setForm({ name: s.name, slug: s.slug, description: s.description ?? "", logo_url: s.logo_url ?? "", website_url: s.website_url ?? "", affiliate_base_url: s.affiliate_base_url ?? "", cashback_percentage: s.cashback_percentage ?? 0, is_active: s.is_active ?? true });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <SEO title="Manage Stores – Admin" />
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Stores</h1>
        <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}><Plus className="mr-1 h-4 w-4" />Add Store</Button>
      </div>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden md:table-cell">Website</TableHead><TableHead className="hidden md:table-cell">Cashback %</TableHead><TableHead>Active</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow> : stores.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[200px]">{s.website_url ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell">{s.cashback_percentage ?? 0}%</TableCell>
                <TableCell>{s.is_active ? "✓" : "✗"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete store?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(s.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Store" : "New Store"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} required /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Logo URL</Label><Input value={form.logo_url ?? ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></div>
              <div className="space-y-2"><Label>Website URL</Label><Input value={form.website_url ?? ""} onChange={(e) => setForm({ ...form, website_url: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Affiliate Base URL</Label><Input value={form.affiliate_base_url ?? ""} onChange={(e) => setForm({ ...form, affiliate_base_url: e.target.value })} /></div>
              <div className="space-y-2"><Label>Cashback %</Label><Input type="number" value={form.cashback_percentage ?? 0} onChange={(e) => setForm({ ...form, cashback_percentage: +e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />Active</label>
            <Button type="submit" className="w-full" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save Store"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
