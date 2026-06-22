import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const SITE_NAME = "EnjoyFreeDeals";
const SITE_URL = "https://enjoyfreedeals.com";
const DEFAULT_DESCRIPTION = "Find the best deals, coupons, and cashback offers from top Indian stores. Save money on electronics, fashion, food, travel & more.";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export { SITE_URL, SITE_NAME };

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  canonical,
  noIndex = false,
  jsonLd,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Best Deals, Coupons & Cashback`;

  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/png" />
      {canonical && <meta property="og:url" content={canonical} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content="EnjoyFreeDeals - Best Deals, Coupons & Cashback" />

      <meta name="ai-content-declaration" content="human-created" />

      {jsonLdArray.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
}
