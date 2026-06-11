import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full opacity-10 blur-3xl"
        style={{ background: "var(--gradient-hero)" }}
      />

      <div className="container relative py-20 md:py-28 px-5">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary animate-pulse-soft opacity-0 animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
            <Sparkles className="h-4 w-4" />
            Save up to 70% + Extra Cashback
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl opacity-0 animate-fade-in" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
            Never Pay Full Price{" "}
            <span className="text-gradient">Again</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground opacity-0 animate-fade-in" style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}>
            Discover the best deals, coupons & cashback offers from India's top stores.
            Shop smarter, save bigger.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center opacity-0 animate-fade-in" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
            <Button size="lg" className="gap-2 px-8 font-semibold shadow-hero transition-transform hover:scale-105" asChild>
              <Link to="/deals">
                Browse Deals
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8 border-primary/30 hover:bg-primary/10 hover:text-primary transition-transform hover:scale-105" asChild>
              <Link to="/stores">View Stores</Link>
            </Button>
          </div>

          <div className="mt-10 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="text-center opacity-0 animate-fade-in" style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}>
              <div className="font-display text-2xl font-bold text-foreground">500+</div>
              <div>Active Deals</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center opacity-0 animate-fade-in" style={{ animationDelay: "0.7s", animationFillMode: "forwards" }}>
              <div className="font-display text-2xl font-bold text-foreground">50+</div>
              <div>Partner Stores</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center opacity-0 animate-fade-in" style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}>
              <div className="font-display text-2xl font-bold text-foreground">10%</div>
              <div>Avg. Cashback</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
