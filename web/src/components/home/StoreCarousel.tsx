import { useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useStores } from "@/hooks/useStores";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, ArrowRight } from "lucide-react";

export default function StoreCarousel() {
  const { data: stores, isLoading } = useStores(12);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      align: "start",
      containScroll: false,
    },
    [
      AutoScroll({
        speed: 0.8,
        startDelay: 500,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ]
  );

  // Reinitialize Embla and restart auto-scroll when stores load
  useEffect(() => {
    if (emblaApi && stores?.length) {
      // Force reInit so Embla recalculates slide dimensions
      emblaApi.reInit();
      const autoScroll = emblaApi.plugins()?.autoScroll;
      if (autoScroll && !autoScroll.isPlaying()) {
        autoScroll.play();
      }
    }
  }, [emblaApi, stores]);

  return (
    <section className="container py-12 px-5">
      <div className="rounded-2xl bg-secondary/30 border border-border p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-bold">Top Stores</h2>
          </div>
          <Link
            to="/stores"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 z-10" style={{ background: 'linear-gradient(to right, hsl(var(--secondary)), transparent)' }} />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 z-10" style={{ background: 'linear-gradient(to left, hsl(var(--secondary)), transparent)' }} />
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-4">
                {/* Duplicate stores for seamless loop */}
                {stores?.concat(stores).map((store, idx) => (
                  <Link
                    key={`${store.id}-${idx}`}
                    to={`/deals?store=${store.slug}`}
                    className="flex flex-col items-center gap-2 group flex-shrink-0"
                    style={{ minWidth: "6.5rem" }}
                  >
                    <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-card border border-border shadow-sm transition-all duration-300 group-hover:shadow-card-hover group-hover:scale-105 group-hover:border-primary/20">
                      {store.logo_url ? (
                        <img
                          src={store.logo_url}
                          alt={`${store.name} logo`}
                          className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
                        />
                      ) : (
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-secondary">
                          <Store className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-foreground text-center leading-tight">
                      {store.name}
                    </span>
                    {store.cashback_percentage != null &&
                      Number(store.cashback_percentage) > 0 && (
                        <span className="inline-flex items-center rounded-full bg-deal-cashback/10 px-2 py-0.5 text-[10px] font-semibold text-deal-cashback border border-deal-cashback/20">
                          {store.cashback_percentage}% Cashback
                        </span>
                      )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
