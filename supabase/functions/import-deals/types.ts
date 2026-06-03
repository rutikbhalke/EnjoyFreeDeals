export type JsonObject = Record<string, unknown>;

export type DealSourceRow = {
  id: string;
  source_key: string;
  source_name: string;
  source_type: string;
  base_url: string;
  secret_name: string;
  config?: JsonObject | null;
  enabled: boolean;
  trust_level: number;
  run_interval_minutes: number;
  last_run_at: string | null;
};

export type SourceDeal = {
  sourceProductId: string;
  sourceUrl: string;
  title: string;
  description?: string;
  categoryName?: string;
  originalPrice: number;
  discountedPrice: number;
  couponCode?: string;
  imageUrl: string;
  affiliateUrl?: string;
  expiryDate?: string;
  cashbackPercentage?: number;
  raw?: JsonObject;
};

export type NormalizedDeal = {
  sourceKey: string;
  sourceName: string;
  sourceProductId: string;
  sourceUrl: string;
  dedupeKey: string;
  slug: string;
  title: string;
  description: string;
  storeName: string;
  storeSlug: string;
  storeUrl: string;
  categoryName: string;
  categorySlug: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  dealType: "DISCOUNT" | "COUPON" | "FREE_DEAL";
  couponCode: string;
  cashbackPercentage: number;
  affiliateLink: string;
  imageUrl: string;
  expiryDate: string | null;
  isFeatured: boolean;
  rawPayload: JsonObject;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  reviewReasons: string[];
  qualityScore: number;
};

export type ImportCounts = {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  needsReview: number;
};

export type SourceImportResult = ImportCounts & {
  sourceKey: string;
  jobId: string | null;
  status: "success" | "failed" | "skipped";
  message: string;
};
