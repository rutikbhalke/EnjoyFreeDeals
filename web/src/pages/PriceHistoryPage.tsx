import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, Tag, TrendingDown, HelpCircle, ExternalLink, RefreshCw, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import SEO, { SITE_URL } from "@/components/SEO";
import { detectPlatform, SupportedPlatform } from "@/lib/platformDetector";

interface PricePoint {
  date: string;
  price: number;
  platform: string;
}

interface ProductDetails {
  title: string;
  image: string;
  category: string;
  currentPrice: number;
  originalPrice: number;
  discountPercent: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  history: PricePoint[];
  comparisons: Array<{
    platform: SupportedPlatform;
    price: number;
    originalPrice: number;
    discountPercent: number;
    url: string;
    isAvailable: boolean;
  }>;
}

export default function PriceHistoryPage() {
  const [searchParams] = useSearchParams();
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const urlParam = searchParams.get("url");

  useEffect(() => {
    if (urlParam) {
      setUrlInput(urlParam);
      loadPriceHistory(urlParam);
    } else {
      setProduct(null);
    }
  }, [urlParam]);

  const detectCategory = (url: string, title: string): string => {
    const lower = (url + " " + title).toLowerCase();
    if (lower.match(/phone|iphone|mobile|samsung|oneplus|pixel|realme|redmi/)) return "Mobiles";
    if (lower.match(/laptop|macbook|dell|hp|lenovo|asus|computer/)) return "Electronics";
    if (lower.match(/shoe|adidas|nike|sneaker|puma|slipper|boot/)) return "Fashion";
    if (lower.match(/tshirt|jeans|shirt|pant|dress|clothing|wear/)) return "Fashion";
    if (lower.match(/grocery|tea|coffee|oil|rice|wheat|snack|food/)) return "Grocery";
    if (lower.match(/lipstick|makeup|beauty|shampoo|cream|perfume/)) return "Beauty";
    if (lower.match(/sofa|chair|table|bed|furniture|home|decor/)) return "Home";
    if (lower.match(/tv|fridge|washing|ac|microwave|appliance/)) return "Appliances";
    if (lower.match(/book|novel|read|comic|author/)) return "Books";
    if (lower.match(/toy|game|doll|lego|boardgame/)) return "Toys";
    return "Electronics";
  };

  const loadPriceHistory = (url: string) => {
    setLoading(true);
    const platform = detectPlatform(url);
    if (!platform) {
      toast({
        title: "Unsupported Platform",
        description: "Please paste a link from Amazon, Flipkart, Myntra, Ajio, Meesho, Snapdeal, TataCliq, Croma, or Nykaa.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Simulate fetching price history (connects to Supabase /api/price-history later)
    setTimeout(() => {
      const lowerUrl = url.toLowerCase();
      let title = "Premium Tracked Item";
      let basePrice = 2999;
      let originalPrice = 4999;
      let img = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60"; // generic product

      if (lowerUrl.includes("iphone") || lowerUrl.includes("apple") || lowerUrl.includes("phone")) {
        title = "Apple iPhone 15 Pro (128 GB) - Blue Titanium";
        basePrice = 119900;
        originalPrice = 134900;
        img = "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60";
      } else if (lowerUrl.includes("laptop") || lowerUrl.includes("macbook") || lowerUrl.includes("computer")) {
        title = "MacBook Air M3 (13-inch, 8GB RAM, 256GB SSD)";
        basePrice = 104900;
        originalPrice = 114900;
        img = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60";
      } else if (lowerUrl.includes("shoe") || lowerUrl.includes("nike") || lowerUrl.includes("adidas")) {
        title = "Nike Air Max Pulse Men's Premium Sneakers";
        basePrice = 12999;
        originalPrice = 15999;
        img = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60";
      } else if (lowerUrl.includes("shirt") || lowerUrl.includes("tshirt") || lowerUrl.includes("myntra") || lowerUrl.includes("ajio")) {
        title = "Levi's Men's Regular Fit Denim Shirt";
        basePrice = 1899;
        originalPrice = 3299;
        img = "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&auto=format&fit=crop&q=60";
      }

      const discountPercent = Math.round(((originalPrice - basePrice) / originalPrice) * 100);
      const category = detectCategory(url, title);

      // Generate history points over 30 days
      const history: PricePoint[] = [];
      const days = 30;
      let curPrice = originalPrice * 0.95;
      const step = (originalPrice - basePrice) / 6;

      for (let i = days; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

        // Simulate some price fluctuations
        if (i === 30) curPrice = originalPrice;
        else if (i === 24) curPrice = originalPrice - step;
        else if (i === 18) curPrice = originalPrice - step * 2;
        else if (i === 12) curPrice = basePrice; // lowest point
        else if (i === 6) curPrice = basePrice + step;
        else if (i === 0) curPrice = basePrice; // current price

        history.push({
          date: dateStr,
          price: Math.round(curPrice),
          platform: platform,
        });
      }

      const pricesList = history.map((p) => p.price);
      const lowestPrice = Math.min(...pricesList);
      const highestPrice = Math.max(...pricesList);
      const averagePrice = Math.round(pricesList.reduce((a, b) => a + b, 0) / pricesList.length);

      // Generate other store comparisons
      const platforms: SupportedPlatform[] = ["Amazon", "Flipkart", "Croma", "Meesho", "Ajio", "Myntra", "TataCliq", "Snapdeal", "Nykaa"];
      const comparisons = platforms
        .filter((p) => p !== platform)
        .slice(0, 4) // Show 4 alternate platforms
        .map((p, idx) => {
          // Add some variation in price
          const priceMultiplier = 0.92 + (idx * 0.04) + (Math.random() * 0.03);
          const compPrice = Math.round(basePrice * priceMultiplier);
          const compOriginal = Math.round(originalPrice * (1 + (idx * 0.01)));
          const compDiscount = Math.round(((compOriginal - compPrice) / compOriginal) * 100);

          return {
            platform: p,
            price: compPrice,
            originalPrice: compOriginal,
            discountPercent: compDiscount,
            url: `https://www.${p.toLowerCase()}.com/search?q=${encodeURIComponent(title)}`,
            isAvailable: true,
          };
        });

      // Add the current platform to comparison list too
      comparisons.unshift({
        platform,
        price: basePrice,
        originalPrice,
        discountPercent,
        url,
        isAvailable: true,
      });

      // Sort so lowest is first
      comparisons.sort((a, b) => a.price - b.price);

      setProduct({
        title,
        image: img,
        category,
        currentPrice: basePrice,
        originalPrice,
        discountPercent,
        lowestPrice,
        highestPrice,
        averagePrice,
        history,
        comparisons,
      });
      setLoading(false);
    }, 800);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      navigate(`/price-history?url=${encodeURIComponent(urlInput.trim())}`);
    }
  };

  // Best time to buy logic
  const buyAdvice = useMemo(() => {
    if (!product) return null;
    const { currentPrice, lowestPrice, averagePrice } = product;

    if (currentPrice <= lowestPrice) {
      return {
        status: "Best Time to Buy",
        color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        message: "Buy Now! The price is currently at its lowest recorded point.",
      };
    } else if (currentPrice < averagePrice) {
      return {
        status: "Good Price",
        color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        message: "This is a good deal! The price is below the average rate.",
      };
    } else {
      return {
        status: "Wait if possible",
        color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        message: "Wait if possible. The price is currently higher than average.",
      };
    }
  }, [product]);

  return (
    <MainLayout>
      <SEO
        title={product ? `Price History for ${product.title}` : "Price History & Comparison"}
        description="Paste any product URL from Amazon, Flipkart, Myntra, Ajio, Meesho, Croma, Nykaa, TataCliq, or Snapdeal to track price history and compare prices."
        canonical={`${SITE_URL}/price-history`}
      />

      <div className="container mx-auto px-5 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header & URL Paste Bar */}
          <div className="text-center md:text-left space-y-4">
            <h1 className="font-display text-3xl font-bold">Price History Tracker</h1>
            <p className="text-muted-foreground text-sm">
              Paste product URLs from India's top e-commerce websites to view price charts and compare stores.
            </p>
            <form onSubmit={handleSearchSubmit} className="flex gap-2 p-1 border border-border rounded-xl bg-card shadow-sm">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste Amazon, Flipkart, Myntra, Ajio, Meesho... URL"
                className="flex-1 px-4 py-2 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" size="sm" className="font-semibold gap-1 rounded-lg">
                Check Price
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Analyzing URL and compiling history...</p>
            </div>
          ) : product ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Product Card Details */}
              <Card className="md:col-span-1 border border-border shadow-sm overflow-hidden h-fit">
                <div className="relative aspect-[4/3] bg-secondary flex items-center justify-center overflow-hidden">
                  <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                  {product.discountPercent > 0 && (
                    <Badge className="absolute left-3 top-3 bg-deal-hot font-bold text-white border-0">
                      {product.discountPercent}% OFF
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <span className="text-[10px] text-primary uppercase font-bold tracking-wider">{product.category}</span>
                    <h3 className="font-display text-base font-bold line-clamp-2 mt-1 leading-snug">{product.title}</h3>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-xl font-bold text-deal-save">
                      ₹{product.currentPrice.toLocaleString("en-IN")}
                    </span>
                    {product.originalPrice > product.currentPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{product.originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  {buyAdvice && (
                    <div className={`p-3 rounded-lg border text-xs font-semibold leading-relaxed ${buyAdvice.color}`}>
                      <span className="block text-sm font-bold mb-1">{buyAdvice.status}</span>
                      {buyAdvice.message}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Price Graph & Statistics */}
              <div className="md:col-span-2 space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="border border-border shadow-sm p-3 text-center">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Lowest Price</p>
                    <p className="font-display text-base font-bold text-emerald-600 mt-1">₹{product.lowestPrice.toLocaleString("en-IN")}</p>
                  </Card>
                  <Card className="border border-border shadow-sm p-3 text-center">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Average Price</p>
                    <p className="font-display text-base font-bold text-primary mt-1">₹{product.averagePrice.toLocaleString("en-IN")}</p>
                  </Card>
                  <Card className="border border-border shadow-sm p-3 text-center">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Highest Price</p>
                    <p className="font-display text-base font-bold text-rose-600 mt-1">₹{product.highestPrice.toLocaleString("en-IN")}</p>
                  </Card>
                </div>

                {/* Price History Chart */}
                <Card className="border border-border shadow-sm">
                  <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="font-display text-base font-bold">30-Day Price Trend</CardTitle>
                      <p className="text-xs text-muted-foreground">Price analysis history for this product</p>
                    </div>
                    {product.currentPrice <= product.lowestPrice && (
                      <Badge className="bg-emerald-600 text-white font-bold gap-1 border-0">
                        <TrendingDown className="h-3 w-3" /> Lowest Ever
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="px-2 pb-4 pt-1">
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={product.history} margin={{ left: 10, right: 15, top: 10, bottom: 5 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            stroke="hsl(var(--muted-foreground))"
                            tickFormatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
                            width={65}
                          />
                          <Tooltip
                            formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Price"]}
                            contentStyle={{
                              borderRadius: 8,
                              border: "1px solid hsl(var(--border))",
                              background: "hsl(var(--card))",
                              fontSize: 11,
                            }}
                          />
                          <ReferenceLine y={product.lowestPrice} stroke="hsl(var(--emerald-500))" strokeDasharray="3 3" />
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            dot={{ r: 3, fill: "hsl(var(--primary))" }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Price Comparisons */}
                <div className="space-y-3">
                  <h3 className="font-display text-base font-bold">Compare Platform Prices</h3>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {product.comparisons.map((c, i) => (
                      <Card
                        key={c.platform + i}
                        className={`border shadow-sm flex items-center justify-between p-4 ${
                          i === 0 ? "border-emerald-500/30 bg-emerald-500/[0.02]" : "border-border"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{c.platform}</span>
                            {i === 0 && (
                              <Badge className="bg-emerald-600 text-white border-0 text-[9px] px-1.5 py-0">
                                Best Price
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-display font-bold text-sm text-foreground">
                              ₹{c.price.toLocaleString("en-IN")}
                            </span>
                            {c.originalPrice > c.price && (
                              <span className="text-[10px] text-muted-foreground line-through">
                                ₹{c.originalPrice.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>

                        <Button size="sm" className="gap-1 font-semibold text-xs h-8" onClick={() => window.open(c.url, "_blank")}>
                          View Deal
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty Landing State */
            <Card className="border border-border shadow-sm p-8 text-center bg-card">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
              <h3 className="font-display text-lg font-bold mb-2">Track E-Commerce Prices Instantly</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                Paste a product detail link from Amazon, Flipkart, Myntra, Ajio, Meesho, Snapdeal, TataCliq, Croma or Nykaa above to check if it's the right time to buy.
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-left text-xs text-muted-foreground border-t border-border pt-6">
                <div>
                  <h4 className="font-bold text-foreground mb-1">1. Paste URL</h4>
                  <p>Copy product link from any supported shopping site and paste it here.</p>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">2. Price History</h4>
                  <p>Check 30-day fluctuations and highest/lowest recorded prices.</p>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">3. Compare & Buy</h4>
                  <p>Compare stores side by side and get redirects to the cheapest deal.</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
