import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Smartphone, Download, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { detectPlatform } from "@/lib/platformDetector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function HeroBanner() {
  const [url, setUrl] = useState("");
  const [isAppOpen, setIsAppOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCheckPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast({
        title: "Please enter a URL",
        description: "Paste an e-commerce product link to check price history.",
        variant: "destructive",
      });
      return;
    }

    const platform = detectPlatform(url);
    if (!platform) {
      toast({
        title: "Unsupported Platform",
        description: "We currently support Amazon, Flipkart, Myntra, Ajio, Meesho, Snapdeal, TataCliq, Croma, and Nykaa.",
        variant: "destructive",
      });
      return;
    }

    // Success! Redirect to price history page
    toast({
      title: "Platform Detected!",
      description: `Analyzing product from ${platform}...`,
    });
    navigate(`/price-history?url=${encodeURIComponent(url.trim())}`);
  };

  const focusInput = () => {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const scrollToDeals = () => {
    window.scrollTo({
      top: window.innerHeight * 0.75,
      behavior: "smooth",
    });
  };

  const platforms = [
    { name: "Amazon", color: "from-amber-500/10 to-amber-600/10 text-amber-600 border-amber-500/20" },
    { name: "Flipkart", color: "from-blue-500/10 to-blue-600/10 text-blue-600 border-blue-500/20" },
    { name: "Myntra", color: "from-pink-500/10 to-pink-600/10 text-pink-600 border-pink-500/20" },
    { name: "Ajio", color: "from-slate-500/10 to-slate-600/10 text-slate-700 border-slate-500/20" },
    { name: "Meesho", color: "from-purple-500/10 to-purple-600/10 text-purple-600 border-purple-500/20" },
    { name: "Snapdeal", color: "from-red-500/10 to-red-600/10 text-red-600 border-red-500/20" },
    { name: "TataCliq", color: "from-emerald-500/10 to-emerald-600/10 text-emerald-700 border-emerald-500/20" },
    { name: "Croma", color: "from-cyan-500/10 to-cyan-600/10 text-cyan-600 border-cyan-500/20" },
    { name: "Nykaa", color: "from-rose-500/10 to-rose-600/10 text-rose-600 border-rose-500/20" },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-transparent to-transparent">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-20 dark:opacity-30 blur-3xl"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full opacity-10 dark:opacity-20 blur-3xl"
        style={{ background: "var(--gradient-hero)" }}
      />

      <div className="container relative py-16 md:py-24 px-5">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary animate-pulse-soft">
            <Sparkles className="h-4 w-4" />
            Track Prices & Compare Across Stores
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
            Smartest Way to <span className="text-gradient">Save Money</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Track product price histories, compare multiple stores, and get instant alerts on drops. Never pay full price again.
          </p>

          {/* URL Search Box */}
          <form onSubmit={handleCheckPrice} className="mx-auto mt-8 max-w-2xl">
            <div className="flex flex-col gap-2 sm:flex-row rounded-xl sm:border border-border bg-card/50 p-2 sm:shadow-lg backdrop-blur-md">
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Amazon, Flipkart, Myntra, Ajio, Meesho, Croma... product URL"
                className="h-12 flex-1 rounded-lg border sm:border-0 border-border bg-background sm:bg-transparent px-4 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
              />
              <Button type="submit" size="lg" className="h-12 gap-2 font-bold shadow-md shrink-0 transition-transform active:scale-95">
                Check Price History
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              ⚡ Track prices, compare stores, save more.
            </p>
          </form>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" onClick={focusInput} className="gap-2 border-primary/20 hover:bg-primary/5 font-semibold transition-all">
              Check Price History
            </Button>
            <Button variant="outline" onClick={scrollToDeals} className="gap-2 border-primary/20 hover:bg-primary/5 font-semibold transition-all">
              Browse Latest Deals
            </Button>
            <Button variant="default" onClick={() => setIsAppOpen(true)} className="gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all">
              <Smartphone className="h-4 w-4" />
              Get Android App
            </Button>
          </div>

          {/* Supported Platforms Grid */}
          <div className="mt-12 text-center">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4">Supported Platforms</h2>
            <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
              {platforms.map((platform) => (
                <div
                  key={platform.name}
                  className={`px-3 py-1 rounded-full border text-xs font-semibold bg-gradient-to-r ${platform.color} transition-all hover:scale-105`}
                >
                  {platform.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Android App Modal Dialog */}
      <Dialog open={isAppOpen} onOpenChange={setIsAppOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold font-display">
              <Smartphone className="h-6 w-6 text-emerald-500" />
              EnjoyFreeDeals App
            </DialogTitle>
            <DialogDescription className="text-sm">
              India's smartest deals and price tracker in your pocket.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-4 border border-border">
              <h3 className="font-semibold text-sm mb-3">Key Features:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Real-time price drop notifications directly on your phone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Exclusive app-only loot deals and coupon codes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Superfast WhatsApp OTP-less quick authentication.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Save deals offline to view later on-the-go.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-bold" asChild>
                <a href="/app-release.apk" download>
                  <Download className="h-4 w-4" />
                  Download Android APK
                </a>
              </Button>
              <Button variant="outline" className="w-full h-11 border-border font-medium" disabled>
                Get it on Google Play (Coming Soon)
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
              <AlertCircle className="h-3 w-3" /> Minimum Android Version: 8.0 Oreo (API 26)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
