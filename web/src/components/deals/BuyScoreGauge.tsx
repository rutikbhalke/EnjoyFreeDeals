type BuyScoreGaugeProps = {
  score: number;
};

export default function BuyScoreGauge({ score }: BuyScoreGaugeProps) {
  const safeScore = Math.max(0, Math.min(100, score));
  const angle = 180 + (safeScore / 100) * 180;
  const radians = (angle * Math.PI) / 180;
  const pointerX = 110 + Math.cos(radians) * 82;
  const pointerY = 110 + Math.sin(radians) * 82;

  return (
    <div className="relative mx-auto h-36 w-full max-w-[260px]">
      <svg viewBox="0 0 220 140" className="h-full w-full overflow-visible">
        <path d="M 28 110 A 82 82 0 0 1 78 34" fill="none" stroke="#FF3B6B" strokeWidth="18" strokeLinecap="round" />
        <path d="M 78 34 A 82 82 0 0 1 143 34" fill="none" stroke="#FF9800" strokeWidth="18" strokeLinecap="round" />
        <path d="M 143 34 A 82 82 0 0 1 192 110" fill="none" stroke="#14B87A" strokeWidth="18" strokeLinecap="round" />
        <circle cx={pointerX} cy={pointerY} r="10" fill="#FF9800" className="drop-shadow-md transition-all duration-500" />
        <circle cx={pointerX} cy={pointerY} r="4" fill="white" />
      </svg>
      <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-4xl font-black text-[#FF9800]">{safeScore}</div>
        <div className="text-[10px] font-bold tracking-[0.2em] text-[#94A3B8]">BUY SCORE</div>
      </div>
      <div className="absolute bottom-0 left-4 text-xs font-bold text-[#94A3B8]">Wait</div>
      <div className="absolute bottom-0 right-4 text-xs font-bold text-[#14B87A]">Buy</div>
    </div>
  );
}

