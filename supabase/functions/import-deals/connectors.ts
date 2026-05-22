import type { DealSourceRow, SourceDeal } from "./types.ts";

type SourceTemplate = Omit<SourceDeal, "raw">;

const DAY_MS = 24 * 60 * 60 * 1000;

export async function fetchSourceDeals(source: DealSourceRow): Promise<SourceDeal[]> {
  const apiSecret = source.secret_name ? Deno.env.get(source.secret_name) : "";

  // v1 is intentionally API/feed-first. Until each source API is wired, these
  // placeholders keep the full importer pipeline testable without scraping HTML.
  if (!apiSecret) {
    return buildMockDeals(source, "mock-no-secret");
  }

  return buildMockDeals(source, "api-placeholder");
}

function buildMockDeals(source: DealSourceRow, connectorMode: string): SourceDeal[] {
  const templates = mockCatalog[source.source_key] || buildGenericTemplate(source);
  return templates.map((deal) => ({
    ...deal,
    sourceUrl: absoluteUrl(deal.sourceUrl, source.base_url),
    affiliateUrl: buildAffiliateUrl(absoluteUrl(deal.sourceUrl, source.base_url), source.source_key),
    raw: {
      connectorMode,
      sourceKey: source.source_key,
      sourceName: source.source_name,
      capturedAt: new Date().toISOString()
    }
  }));
}

function buildGenericTemplate(source: DealSourceRow): SourceTemplate[] {
  return [
    {
      sourceProductId: `${source.source_key}-sample-1`,
      sourceUrl: source.base_url,
      title: `${source.source_name} Sample Deal`,
      description: `Placeholder API response for ${source.source_name}.`,
      categoryName: "General",
      originalPrice: 999,
      discountedPrice: 699,
      couponCode: "",
      imageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=900&q=80",
      expiryDate: daysFromNow(3)
    }
  ];
}

function absoluteUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

function buildAffiliateUrl(url: string, campaign: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("affid", "enjoyfreedeals");
    parsed.searchParams.set("utm_source", "scraper");
    parsed.searchParams.set("utm_campaign", campaign);
    return parsed.toString();
  } catch {
    return url;
  }
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

const mockCatalog: Record<string, SourceTemplate[]> = {
  amazon: [
    {
      sourceProductId: "B0CBOAT60",
      sourceUrl: "/dp/B0CBOAT60",
      title: "boAt Airdopes Bluetooth Earbuds",
      description: "Deep bass wireless earbuds with fast charging case.",
      categoryName: "Electronics",
      originalPrice: 3999,
      discountedPrice: 1599,
      couponCode: "BOAT60",
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80",
      expiryDate: daysFromNow(2)
    },
    {
      sourceProductId: "BAGDEAL55",
      sourceUrl: "/dp/BAGDEAL55",
      title: "Water Resistant Laptop Backpack",
      description: "Office laptop backpack with organizer pockets.",
      categoryName: "Fashion",
      originalPrice: 1999,
      discountedPrice: 899,
      couponCode: "BAG55",
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
      expiryDate: daysFromNow(4)
    }
  ],
  flipkart: [
    {
      sourceProductId: "itmrealme20",
      sourceUrl: "/realme-5g-smartphone/p/itmrealme20",
      title: "Realme 5G Smartphone",
      description: "5G smartphone offer with exchange and bank savings.",
      categoryName: "Mobile Deals",
      originalPrice: 16999,
      discountedPrice: 13599,
      couponCode: "REALME20",
      imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
      expiryDate: daysFromNow(3)
    }
  ],
  myntra: [
    {
      sourceProductId: "myntra-run55",
      sourceUrl: "/sports-shoes/example-running-shoes/123456/buy",
      title: "Lightweight Running Shoes",
      description: "Running shoes with extra coupon savings.",
      categoryName: "Fashion",
      originalPrice: 3499,
      discountedPrice: 1575,
      couponCode: "RUN55",
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
      expiryDate: daysFromNow(5)
    }
  ],
  ajio: [
    {
      sourceProductId: "ajio50",
      sourceUrl: "/cotton-crew-neck-tshirt/p/ajio50",
      title: "Premium Cotton Crew Neck T-Shirt",
      description: "Premium cotton t-shirt with weekend pricing.",
      categoryName: "Fashion",
      originalPrice: 999,
      discountedPrice: 499,
      couponCode: "AJIO50",
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
      expiryDate: daysFromNow(2)
    }
  ],
  croma: [
    {
      sourceProductId: "croma-speaker-123456",
      sourceUrl: "/portable-bluetooth-speaker/p/123456",
      title: "Portable Bluetooth Speaker",
      description: "Portable speaker with punchy sound and compact design.",
      categoryName: "Electronics",
      originalPrice: 2499,
      discountedPrice: 1749,
      couponCode: "CROMA30",
      imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80",
      expiryDate: daysFromNow(3)
    },
    {
      sourceProductId: "croma-student-laptop-243156",
      sourceUrl: "/student-laptop-deal/p/243156",
      title: "Student Laptop Deal",
      description: "Lightweight laptop with student exchange and bank discount.",
      categoryName: "Student Deals",
      originalPrice: 52999,
      discountedPrice: 44999,
      couponCode: "STUDENT15",
      imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
      expiryDate: daysFromNow(6)
    }
  ],
  tatacliq: [
    {
      sourceProductId: "tatacliq-watch40",
      sourceUrl: "/fitness-smartwatch-with-calling/p-mp000000watch40",
      title: "Fitness Smartwatch With Calling",
      description: "Fitness smartwatch with notifications and long battery life.",
      categoryName: "Electronics",
      originalPrice: 5999,
      discountedPrice: 3599,
      couponCode: "WATCH40",
      imageUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=900&q=80",
      expiryDate: daysFromNow(4)
    }
  ]
};
