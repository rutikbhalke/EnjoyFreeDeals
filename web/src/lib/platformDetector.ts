/**
 * Helper utility to detect e-commerce platforms from URLs.
 */

export type SupportedPlatform =
  | "Amazon"
  | "Flipkart"
  | "Myntra"
  | "Ajio"
  | "Meesho"
  | "Snapdeal"
  | "TataCliq"
  | "Croma"
  | "Nykaa";

export const SUPPORTED_DOMAINS: Record<string, SupportedPlatform> = {
  "amazon.in": "Amazon",
  "amazon.com": "Amazon",
  "amzn.to": "Amazon",
  "flipkart.com": "Flipkart",
  "fkrt.it": "Flipkart",
  "myntra.com": "Myntra",
  "ajio.com": "Ajio",
  "meesho.com": "Meesho",
  "snapdeal.com": "Snapdeal",
  "tatacliq.com": "TataCliq",
  "croma.com": "Croma",
  "nykaa.com": "Nykaa",
};

export function detectPlatform(url: string): SupportedPlatform | null {
  if (!url || typeof url !== "string") return null;

  try {
    // Add protocol if not present
    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }

    const parsed = new URL(cleanUrl);
    const hostname = parsed.hostname.toLowerCase();

    // Check direct matches or subdomains
    for (const [domain, platform] of Object.entries(SUPPORTED_DOMAINS)) {
      if (hostname === domain || hostname.endsWith("." + domain)) {
        return platform;
      }
    }
  } catch (error) {
    // Fallback if URL parsing fails
    const lowerUrl = url.toLowerCase();
    for (const [domain, platform] of Object.entries(SUPPORTED_DOMAINS)) {
      if (lowerUrl.includes(domain)) {
        return platform;
      }
    }
  }

  return null;
}
