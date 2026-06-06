import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStores } from "@/hooks/useStores";
import { useCategories } from "@/hooks/useCategories";
import MainLayout from "@/components/layout/MainLayout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, ArrowLeft } from "lucide-react";
import { Link, Navigate } from "react-router-dom";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function SubmitDealPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: stores = [] } = useStores();
  const { data: categories = [] } = useCategories();

  const [form, setForm] = useState({
    title: "",
    description: "",
    store_id: "",
    category_id: "",
    original_price: "" as string,
    discounted_price: "" as string,
    coupon_code: "",
    affiliate_link: "",
    image_url: "",
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in");
      if (!form.title.trim()) throw new Error("Title is required");
      if (!form.store_id) throw new Error("Store is required");

      const { error } = await supabase.from("deals").insert({
        title: form.title.trim(),
        slug: slugify(form.title) + "-" + Date.now().toString(36),
        description: form.description.trim() || null,
        store_id: form.store_id,
        category_id: form.category_id || null,
        original_price: form.original_price ? +form.original_price : null,
        discounted_price: form.discounted_price ? +form.discounted_price : null,
        coupon_code: form.coupon_code.trim() || null,
        affiliate_link: form.affiliate_link.trim() || null,
        image_url: form.image_url.trim() || null,
        submitted_by: user.id,
        source: "user",
        status: "draft",
        is_verified: false,
        is_featured: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Deal submitted!", description: "Your deal is pending admin review." });
      navigate("/deals");
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const isLoadingDeps = stores.length === 0 || categories.length === 0;

  if (!user) return <Navigate to="/auth" replace />;

  if (isLoadingDeps) {
    return (
      <MainLayout>
        <SEO title="Submit a Deal" />
        <div className="container mx-auto max-w-2xl px-5 py-8">
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-5">
            <div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-64" /></div>
            <div className="space-y-2"><Label className="text-muted-foreground">Deal Title</Label><Skeleton className="h-10 w-full" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-muted-foreground">Store</Label><Skeleton className="h-10 w-full" /></div>
              <div className="space-y-2"><Label className="text-muted-foreground">Category</Label><Skeleton className="h-10 w-full" /></div>
            </div>
            <div className="space-y-2"><Label className="text-muted-foreground">Description</Label><Skeleton className="h-24 w-full" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-muted-foreground">Original Price</Label><Skeleton className="h-10 w-full" /></div>
              <div className="space-y-2"><Label className="text-muted-foreground">Deal Price</Label><Skeleton className="h-10 w-full" /></div>
            </div>
            <div className="space-y-2"><Label className="text-muted-foreground">Deal Link</Label><Skeleton className="h-10 w-full" /></div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO title="Submit a Deal" description="Share a great deal with the community" />
      <div className="container mx-auto max-w-2xl px-5 py-8">
        <Button variant="ghost" size="sm" className="mb-4 gap-1" asChild>
          <Link to="/deals"><ArrowLeft className="h-4 w-4" />Back to Deals</Link>
        </Button>

        <div className="rounded-xl border border-border bg-card p-6 md:p-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold">Submit a Deal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Share a deal with the community. It will be reviewed by our team before going live.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitMutation.mutate();
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label>Deal Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. 50% off on Nike shoes"
                maxLength={200}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Store *</Label>
                <Select value={form.store_id} onValueChange={(v) => setForm({ ...form, store_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tell us more about this deal..."
                rows={3}
                maxLength={2000}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Original Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.original_price}
                  onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                  placeholder="999"
                />
              </div>
              <div className="space-y-2">
                <Label>Deal Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discounted_price}
                  onChange={(e) => setForm({ ...form, discounted_price: e.target.value })}
                  placeholder="499"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coupon Code</Label>
                <Input
                  value={form.coupon_code}
                  onChange={(e) => setForm({ ...form, coupon_code: e.target.value })}
                  placeholder="SAVE50"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label>Deal Link</Label>
                <Input
                  type="url"
                  value={form.affiliate_link}
                  onChange={(e) => setForm({ ...form, affiliate_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                type="url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={submitMutation.isPending}
            >
              <Send className="h-4 w-4" />
              {submitMutation.isPending ? "Submitting…" : "Submit Deal for Review"}
            </Button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
