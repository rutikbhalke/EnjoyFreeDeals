import { useState } from "react";
import { Ticket, Copy, Check, Search, Percent, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import SEO, { SITE_URL } from "@/components/SEO";

interface Coupon {
  id: string;
  storeName: string;
  logoUrl: string;
  title: string;
  code: string;
  discount: string;
  validity: string;
  redirectUrl: string;
}

export default function CouponsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const allCoupons: Coupon[] = [
    {
      id: "1",
      storeName: "Amazon",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
      title: "Flat ₹100 Off on Electronics & Accessories",
      code: "AMZNELEC100",
      discount: "₹100 Off",
      validity: "Valid till 25 Jun 2026",
      redirectUrl: "https://www.amazon.in",
    },
    {
      id: "2",
      storeName: "Flipkart",
      logoUrl: "https://logo.clearbit.com/flipkart.com",
      title: "Extra 10% Off on Home Decor & Kitchen Tools",
      code: "FKHOME10",
      discount: "10% Off",
      validity: "Valid till 30 Jun 2026",
      redirectUrl: "https://www.flipkart.com",
    },
    {
      id: "3",
      storeName: "Myntra",
      logoUrl: "https://logo.clearbit.com/myntra.com",
      title: "Flat ₹400 Off on Premium Fashion Wear",
      code: "MYNTRA400",
      discount: "₹400 Off",
      validity: "Valid till 15 Jul 2026",
      redirectUrl: "https://www.myntra.com",
    },
    {
      id: "4",
      storeName: "Ajio",
      logoUrl: "https://logo.clearbit.com/ajio.com",
      title: "Flat 15% Off on Footwear & Sports Wear",
      code: "AJIOSPORT15",
      discount: "15% Off",
      validity: "Valid till 28 Jun 2026",
      redirectUrl: "https://www.ajio.com",
    },
    {
      id: "5",
      storeName: "Meesho",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/80/Meesho_Logo_Full.png",
      title: "Free Shipping + Flat ₹50 Off on first purchase",
      code: "MEESHONEW50",
      discount: "₹50 Off",
      validity: "Valid till 31 Dec 2026",
      redirectUrl: "https://www.meesho.com",
    },
    {
      id: "6",
      storeName: "Croma",
      logoUrl: "https://media-ik.croma.com/prod/https://media.croma.com/image/upload/v1664415872/Croma%20Assets/CMS/Homepage%20Banners/Croma_logo_hqvdqv.svg",
      title: "Flat ₹500 Off on select Smartphones & Laptops",
      code: "CROMAMOB500",
      discount: "₹500 Off",
      validity: "Valid till 30 Jun 2026",
      redirectUrl: "https://www.croma.com",
    },
    {
      id: "7",
      storeName: "Nykaa",
      logoUrl: "https://logo.clearbit.com/nykaa.com",
      title: "Flat 10% Off on Cosmetics & Skin Care Kits",
      code: "NYKAABEAUTY",
      discount: "10% Off",
      validity: "Valid till 10 Jul 2026",
      redirectUrl: "https://www.nykaa.com",
    },
    {
      id: "8",
      storeName: "TataCliq",
      logoUrl: "https://logo.clearbit.com/tatacliq.com",
      title: "Flat ₹300 Off on Luxury Apparels",
      code: "CLIQ300",
      discount: "₹300 Off",
      validity: "Valid till 20 Jun 2026",
      redirectUrl: "https://www.tatacliq.com",
    },
  ];

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({
      title: "Coupon Copied!",
      description: `Code "${code}" copied to clipboard.`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCoupons = allCoupons.filter(
    (c) =>
      c.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <MainLayout>
      <SEO
        title="Active Store Coupons & Promo Codes"
        description="Browse and copy active coupon codes and promo codes from top e-commerce platforms like Amazon, Flipkart, Myntra, Ajio, Croma, Meesho, and Nykaa."
        canonical={`${SITE_URL}/coupons`}
      />

      <div className="container mx-auto px-5 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="text-center md:text-left space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-2 text-primary font-bold">
              <Ticket className="h-5 w-5" />
              <span>Exclusive Promo Codes</span>
            </div>
            <h1 className="font-display text-3xl font-bold">Active Store Coupons</h1>
            <p className="text-muted-foreground text-sm">
              Copy exclusive coupon codes from top stores to get extra discounts at checkout.
            </p>

            {/* Filter Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coupons by store name or title..."
                className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Coupons List */}
          {filteredCoupons.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {filteredCoupons.map((coupon) => (
                <Card key={coupon.id} className="border border-border shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 flex flex-row items-center gap-3 space-y-0 pb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary border border-border p-2 shrink-0">
                      <img src={coupon.logoUrl} alt={coupon.storeName} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-foreground">{coupon.storeName}</span>
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[9px] px-1.5 py-0 font-bold">
                          <Percent className="h-2.5 w-2.5 mr-0.5" />
                          {coupon.discount}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">{coupon.validity}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="px-4 py-2 flex-1">
                    <p className="font-display text-sm font-semibold leading-snug line-clamp-2 text-foreground">
                      {coupon.title}
                    </p>
                  </CardContent>

                  <CardFooter className="px-4 py-3 bg-secondary/30 border-t border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-primary/30 bg-primary/5 min-w-0 flex-1">
                      <span className="font-mono font-bold text-xs tracking-wider text-foreground truncate select-all">
                        {coupon.code}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant={copiedId === coupon.id ? "default" : "outline"}
                      className={`gap-1.5 font-bold text-xs shadow-sm ${
                        copiedId === coupon.id ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""
                      }`}
                      onClick={() => handleCopyCode(coupon.id, coupon.code)}
                    >
                      {copiedId === coupon.id ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                      onClick={() => window.open(coupon.redirectUrl, "_blank")}
                      title={`Visit ${coupon.storeName}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto opacity-30 mb-2" />
              <p className="text-sm font-semibold">No coupons match your search query.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
