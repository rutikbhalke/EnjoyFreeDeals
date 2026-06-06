import { Link } from "react-router-dom";
import { ArrowRight, Server, Wallet, Zap } from "lucide-react";

const banners = [
  {
    title: "Earn up to 10% Cashback",
    subtitle: "On every purchase from top stores. Shop smarter, save bigger.",
    icon: Wallet,
    cta: "Browse Deals",
    link: "/deals",
    gradient: "from-emerald-600 to-green-800",
    iconBg: "bg-white/20",
  },
  {
    title: "Hosting & Cloud Deals",
    subtitle: "Exclusive discounts on VPS, hosting & cloud platforms.",
    icon: Server,
    cta: "View Hosting Deals",
    link: "/deals?category=hosting",
    gradient: "from-slate-800 to-slate-950",
    iconBg: "bg-white/10",
  },
  {
    title: "Fresh Deals - Up to 70% Off",
    subtitle: "Recently updated offers from top stores.",
    icon: Zap,
    cta: "Shop Now",
    link: "/deals?sort=newest",
    gradient: "from-red-600 to-amber-600",
    iconBg: "bg-white/20",
  },
];

export default function PromoBanners() {
  return (
    <section className="container py-8 px-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {banners.map((banner) => {
          const Icon = banner.icon;
          return (
            <Link
              key={banner.title}
              to={banner.link}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${banner.gradient} p-6 md:p-7 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
            >
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

              <div className="relative z-10">
                <div className={`mb-4 inline-flex items-center justify-center rounded-xl ${banner.iconBg} p-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold leading-tight mb-1">{banner.title}</h3>
                <p className="text-sm text-white/80 mb-4">{banner.subtitle}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold group-hover:underline">
                  {banner.cta} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
