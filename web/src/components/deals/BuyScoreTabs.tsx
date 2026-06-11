export type BuyScoreRange = "now" | "15" | "30";

type BuyScoreTabsProps = {
  value: BuyScoreRange;
  onChange: (value: BuyScoreRange) => void;
};

const tabs: Array<{ value: BuyScoreRange; label: string }> = [
  { value: "now", label: "Right now" },
  { value: "15", label: "In 15 days" },
  { value: "30", label: "In 30 days" },
];

export default function BuyScoreTabs({ value, onChange }: BuyScoreTabsProps) {
  return (
    <div className="grid grid-cols-3 rounded-full bg-[#F4F6FA] p-1 dark:bg-muted">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`rounded-full px-3 py-2 text-xs font-bold transition-all ${
            value === tab.value
              ? "bg-white text-[#6D28D9] shadow-sm dark:bg-card"
              : "text-[#94A3B8] hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

