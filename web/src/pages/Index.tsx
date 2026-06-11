import MainLayout from "@/components/layout/MainLayout";
import SEO, { SITE_URL, SITE_NAME } from "@/components/SEO";
import HeroBanner from "@/components/home/HeroBanner";
import GoldSilverPrice from "@/components/home/GoldSilverPrice";
import PromoBanners from "@/components/home/PromoBanners";
import StoreCarousel from "@/components/home/StoreCarousel";
import CategoryLinks from "@/components/home/CategoryLinks";
import DealSection from "@/components/home/DealSection";
import { useFeaturedDeals, useTrendingDeals, useTopRatedDeals } from "@/hooks/useDeals";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useRecommendedDeals } from "@/hooks/useRecommendedDeals";
import { useAuth } from "@/contexts/AuthContext";
import { Star, TrendingUp, History, Sparkles, ThumbsUp } from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  const featured = useFeaturedDeals();
  const trending = useTrendingDeals();
  const topRated = useTopRatedDeals();
  const recentlyViewed = useRecentlyViewed();
  const recommended = useRecommendedDeals();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: "India's smartest free deals & cashback platform. Find the best deals, coupons, and cashback offers.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/deals?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is EnjoyFreeDeals?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "EnjoyFreeDeals is India's smartest free deals and cashback platform. We curate the best deals, coupons, and cashback offers from top Indian stores so you can save money on electronics, fashion, food, travel, and more.",
        },
      },
      {
        "@type": "Question",
        name: "How do I find the best deals?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Browse our curated deal sections including Featured Deals, Trending Now, and Top Rated. You can also filter deals by category or store, and use the search to find specific products.",
        },
      },
      {
        "@type": "Question",
        name: "Is EnjoyFreeDeals free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, EnjoyFreeDeals is completely free. You can browse deals, use coupon codes, and earn cashback without any subscription or membership fee.",
        },
      },
      {
        "@type": "Question",
        name: "How does cashback work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Click on a deal through our platform, complete your purchase at the store, and earn cashback that gets credited to your wallet. You can withdraw your cashback balance once it reaches the minimum threshold.",
        },
      },
      {
        "@type": "Question",
        name: "How can I get notified about new deals?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Create a free account and add deals to your watchlist. You'll receive notifications when prices drop or when new deals matching your interests are posted.",
        },
      },
      {
        "@type": "Question",
        name: "What types of deals are available on EnjoyFreeDeals?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "EnjoyFreeDeals covers a wide range of categories including electronics, fashion, food delivery, travel, mobile recharges, OTT subscriptions, groceries, and more. Whether you're looking for smartphone discounts, clothing sales, or restaurant offers, we have deals from all major Indian categories.",
        },
      },
      {
        "@type": "Question",
        name: "Which stores are featured on EnjoyFreeDeals?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We feature deals from India's top stores including Amazon India, Flipkart, Myntra, Ajio, Swiggy, Zomato, MakeMyTrip, Nykaa, Meesho, Croma, and many more. New stores are added regularly to give you the widest selection of deals and cashback offers.",
        },
      },
      {
        "@type": "Question",
        name: "How do I submit a deal on EnjoyFreeDeals?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Anyone can submit a deal! Simply create a free account, click 'Submit Deal', fill in the deal details like title, price, store, and link, and our community will vote and verify it. Top community-submitted deals get featured on the homepage.",
        },
      },
      {
        "@type": "Question",
        name: "Are the coupon codes on EnjoyFreeDeals verified?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, our team and community actively verify coupon codes. Each deal shows its verification status, and users can confirm whether a code is working. We prioritize showing verified and recently confirmed coupons so you don't waste time on expired codes.",
        },
      },
      {
        "@type": "Question",
        name: "Can I track price drops on products?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely! Add any deal to your watchlist and set a target price. EnjoyFreeDeals tracks price history and notifies you when the price drops to your desired level. You can also view price history charts to find the best time to buy.",
        },
      },
    ],
  };

  return (
    <MainLayout>
      <SEO canonical={SITE_URL} jsonLd={[websiteJsonLd, orgJsonLd, faqJsonLd]} />
      <HeroBanner />
      <GoldSilverPrice />
      <PromoBanners />
      <StoreCarousel />
      <CategoryLinks />
      {user && recentlyViewed.data && recentlyViewed.data.length > 0 && (
        <DealSection
          title="Recently Viewed"
          icon={<History className="h-6 w-6 text-muted-foreground" />}
          deals={recentlyViewed.data as any[]}
          isLoading={recentlyViewed.isLoading}
          viewAllLink="/deals"
        />
      )}
      {user && recommended.data && recommended.data.length > 0 && (
        <DealSection
          title="Recommended For You"
          icon={<Sparkles className="h-6 w-6 text-amber-500" />}
          deals={recommended.data as any[]}
          isLoading={recommended.isLoading}
          viewAllLink="/deals"
        />
      )}
      <DealSection
        title="Featured Deals"
        icon={<Star className="h-6 w-6 text-deal-cashback" />}
        deals={featured.data}
        isLoading={featured.isLoading}
        viewAllLink="/deals?sort=newest"
      />
      <DealSection
        title="Top Rated"
        icon={<ThumbsUp className="h-6 w-6 text-primary" />}
        deals={topRated.data}
        isLoading={topRated.isLoading}
        viewAllLink="/deals?sort=top-rated"
      />
      <DealSection
        title="Trending Now"
        icon={<TrendingUp className="h-6 w-6 text-primary" />}
        deals={trending.data}
        isLoading={trending.isLoading}
        viewAllLink="/deals"
      />
    </MainLayout>
  );
}
