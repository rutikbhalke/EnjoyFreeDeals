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

type Cat = Tables<"categories">;
function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

const empty: Partial<TablesInsert<"categories">> = { name: "", slug: "", description: "", icon: "", is_active: true };

export default function AdminCategories() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [form, setForm] = useState<Partial<TablesInsert<"categories">>>(empty);

  const { data: cats = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => { const { data, error } = await supabase.from("categories").select("*").order("name"); if (error) throw error; return data; },
  });

  const save = useMutation({
    mutationFn: async (c: Partial<TablesInsert<"categories">>) => {
      const payload = { ...c, slug: c.slug || slugify(c.name || "") };
      if (editing) { const { error } = await supabase.from("categories").update(payload).eq("id", editing.id); if (error) throw error; }
      else { const { error } = await supabase.from("categories").insert(payload as TablesInsert<"categories">); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); toast({ title: editing ? "Category updated" : "Category created" }); setOpen(false); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); toast({ title: "Category deleted" }); },
  });

  const openEdit = (c: Cat) => { setEditing(c); setForm({ name: c.name, slug: c.slug, description: c.description ?? "", icon: c.icon ?? "", is_active: c.is_active ?? true }); setOpen(true); };

  return (
    <div className="space-y-6">
      <SEO title="Manage Categories – Admin" />
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Categories</h1>
        <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}><Plus className="mr-1 h-4 w-4" />Add Category</Button>
      </div>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Icon</TableHead><TableHead>Name</TableHead><TableHead>Active</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow> : cats.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-xl">{c.icon ?? "📁"}</TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.is_active ? "✓" : "✗"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete category?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(c.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} required /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div className="space-y-2"><Label>Icon (emoji)</Label><Input value={form.icon ?? ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🛍️" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />Active</label>
            <Button type="submit" className="w-full" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save Category"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
