import { Link, useLocation } from "react-router-dom";
import { Home, Tag, Grid3X3, Bell, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Deals", icon: Tag, href: "/deals" },
  { label: "Categories", icon: Grid3X3, href: "/categories" },
  { label: "Alerts", icon: Bell, href: "/profile", authHref: "/auth", showBadge: true },
  { label: "Profile", icon: User, href: "/profile", authHref: "/auth" },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ label, icon: Icon, href, authHref, showBadge }) => {
          const needsAuth = label === "Profile" || label === "Alerts";
          const resolvedHref = needsAuth && !user ? (authHref ?? "/auth") : href;
          const isActive =
            resolvedHref === "/"
              ? pathname === "/"
              : pathname.startsWith(resolvedHref);

          return (
            <Link
              key={label}
              to={resolvedHref}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="relative">
                <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                {showBadge && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
