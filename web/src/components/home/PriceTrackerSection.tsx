import { FormEvent, useRef, useState } from "react";
import PriceTrackerHero from "@/components/home/PriceTrackerHero";
import PriceTrackingResult from "@/components/home/PriceTrackingResult";
import { trackPrice, TrackPriceResult } from "@/lib/api";

export default function PriceTrackerSection() {
  const [productUrl, setProductUrl] = useState("");
  const [result, setResult] = useState<TrackPriceResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedUrl = productUrl.trim();
    if (!trimmedUrl) {
      setError("Please paste a valid product link.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const trackingResult = await trackPrice(trimmedUrl);
      setResult(trackingResult);
      window.setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (apiError) {
      const message = apiError instanceof Error ? apiError.message : "Price tracking failed.";
      setError(normalizeErrorMessage(message));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <PriceTrackerHero
        productUrl={productUrl}
        setProductUrl={setProductUrl}
        onSubmit={onSubmit}
        isLoading={isLoading}
        error={error}
        hasResult={Boolean(result)}
      />
      <div ref={resultRef}>
        <PriceTrackingResult result={result} isLoading={isLoading} />
      </div>
    </>
  );
}

function normalizeErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("network error")) {
    return "Backend API is not reachable. Please check Vercel backend URL.";
  }
  if (lower.includes("invalid producturl") || lower.includes("a valid producturl is required")) {
    return "Please paste a valid product link.";
  }
  if (lower.includes("tracking started")) {
    return "Tracking started. Price data will appear after the next fetch.";
  }
  return message;
}
