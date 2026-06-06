import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AmazonLookupResult {
  title?: string;
  image_url?: string;
  description?: string;
  original_price?: number;
  discounted_price?: number;
}

interface AmazonLookupProps {
  onResult: (data: AmazonLookupResult) => void;
}

export default function AmazonLookupButton({ onResult }: AmazonLookupProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLookup = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("amazon-product-lookup", {
        body: { url: url.trim() },
      });
      if (error) throw error;
      if (data?.product) {
        onResult(data.product);
        toast({ title: "Product data loaded from Amazon" });
        setUrl("");
      } else {
        toast({ title: "No product data found", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Lookup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
      <Label className="text-xs font-medium text-primary">Amazon Product Lookup</Label>
      <div className="flex gap-2">
        <Input
          placeholder="Paste Amazon URL or ASIN…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleLookup}
          disabled={loading || !url.trim()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
