import { useMemo, useState } from "react";
import BuyScoreGauge from "./BuyScoreGauge";
import BuyScoreTabs, { type BuyScoreRange } from "./BuyScoreTabs";
import { buildBuyScore, recommendationSubtitle, recommendationTitle, type BuyScoreInput } from "@/lib/buyScore";

type BuyScoreCardProps = {
  input: BuyScoreInput;
  className?: string;
};

export default function BuyScoreCard({ input, className = "" }: BuyScoreCardProps) {
  const [range, setRange] = useState<BuyScoreRange>("now");
  const scoreModel = useMemo(() => buildBuyScore(input), [input]);
  const selectedScore =
    range === "15" ? scoreModel.scoreIn15Days :
    range === "30" ? scoreModel.scoreIn30Days :
    scoreModel.currentScore;
  const tone = selectedScore >= 70 ? "text-[#14B87A]" : selectedScore >= 50 ? "text-[#FF9800]" : "text-[#FF3B6B]";

  return (
    <section className={`rounded-3xl border border-border/60 bg-white p-5 shadow-xl shadow-slate-950/10 dark:bg-card ${className}`}>
      <h2 className="text-center font-display text-lg font-black text-[#1E293B] dark:text-foreground">Good time to buy?</h2>
      <BuyScoreGauge score={selectedScore} />
      <div className="mt-2 text-center">
        <h3 className={`font-display text-lg font-black ${tone}`}>{recommendationTitle(selectedScore)}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-[#64748B] dark:text-muted-foreground">
          {recommendationSubtitle(selectedScore)}
        </p>
      </div>
      <div className="mt-5">
        <BuyScoreTabs value={range} onChange={setRange} />
      </div>
    </section>
  );
}

