import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, ChevronRight, History, Info, Link2, Loader2, Sparkles } from "lucide-react";
import { FormEvent } from "react";

type Props = {
  productUrl: string;
  setProductUrl: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  error: string;
  hasResult: boolean;
};

const platforms = [
  { name: "Amazon", accent: "from-amber-100 to-orange-50 text-orange-700" },
  { name: "Flipkart", accent: "from-blue-100 to-sky-50 text-blue-700" },
  { name: "Myntra", accent: "from-pink-100 to-rose-50 text-rose-700" },
  { name: "Ajio", accent: "from-indigo-100 to-violet-50 text-indigo-700" },
  { name: "Croma", accent: "from-cyan-100 to-emerald-50 text-cyan-700" },
  { name: "TataCliq", accent: "from-slate-100 to-emerald-50 text-slate-700" },
];

export default function PriceTrackerHero({ productUrl, setProductUrl, onSubmit, isLoading, error, hasResult }: Props) {
  return (
    <section className="bg-gradient-to-b from-emerald-50/60 via-white to-white px-3 py-8 md:px-5 md:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-200/70 bg-white shadow-[0_24px_80px_rgba(15,118,110,0.13)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.08)_1px,transparent_1px)] bg-[size:38px_38px]" />
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-lime-100/70 blur-3xl" />
          <svg
            className="pointer-events-none absolute right-6 top-8 hidden h-28 w-72 text-emerald-500/20 lg:block"
            viewBox="0 0 320 120"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 92 C44 80 58 34 100 48 C138 61 142 98 184 76 C222 56 226 18 266 28 C290 34 302 50 316 42"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M4 92 C44 80 58 34 100 48 C138 61 142 98 184 76 C222 56 226 18 266 28 C290 34 302 50 316 42"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="8 10"
              strokeLinecap="round"
            />
          </svg>

          <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-7 md:px-10 md:py-12 lg:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <Badge className="mb-5 gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50">
                <Sparkles className="h-3.5 w-3.5" />
                Web price tracker
              </Badge>

              <h2 className="font-display text-3xl font-bold leading-tight text-slate-950 sm:text-4xl md:text-5xl">
                Never overpay again, because prices{" "}
                <span className="text-emerald-600">have a past!</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Track price history, compare prices, and buy at the right moment.
              </p>
            </div>

            <form
              onSubmit={onSubmit}
              className="mx-auto mt-8 flex max-w-4xl flex-col gap-2 rounded-[1.35rem] border border-emerald-200/80 bg-white/95 p-2 shadow-[0_16px_40px_rgba(15,118,110,0.14)] backdrop-blur sm:flex-row sm:items-center"
            >
              <div className="relative flex min-w-0 flex-1 items-center">
                <div className="pointer-events-none absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Link2 className="h-5 w-5" />
                </div>
                <Input
                  value={productUrl}
                  onChange={(event) => setProductUrl(event.target.value)}
                  placeholder="Paste Amazon / Flipkart / Myntra / Ajio product link"
                  className="h-14 rounded-2xl border-0 bg-transparent pl-16 pr-4 text-base shadow-none placeholder:text-slate-400 focus-visible:ring-0"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 rounded-2xl bg-emerald-600 px-6 font-bold text-white shadow-[0_12px_24px_rgba(5,150,105,0.28)] transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_16px_30px_rgba(5,150,105,0.34)] sm:min-w-44"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                {isLoading ? "Tracking..." : "Track Price"}
              </Button>
            </form>

            {error && (
              <div className="mx-auto mt-3 max-w-4xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {platforms.map((platform) => (
                <PlatformHistoryCard key={platform.name} platform={platform} />
              ))}
            </div>

            {!hasResult && (
              <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/75 p-4 text-sm text-emerald-900 shadow-sm sm:flex-row sm:items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                  <Info className="h-5 w-5" />
                </div>
                <p className="leading-6">
                  Price history will appear after more tracking data is collected.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PlatformHistoryCard({ platform }: { platform: (typeof platforms)[number] }) {
  return (
    <div className="group flex min-h-28 items-center gap-4 rounded-2xl border border-emerald-100 bg-white/95 p-4 shadow-[0_10px_26px_rgba(15,23,42,0.07)] transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_18px_36px_rgba(15,118,110,0.13)]">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${platform.accent} shadow-inner`}>
        <History className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-bold text-slate-950">{platform.name}</div>
        <div className="mt-1 text-sm font-medium text-slate-500">Price History</div>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 transition-transform group-hover:translate-x-1">
        <ChevronRight className="h-4 w-4" />
      </div>
    </div>
  );
}
