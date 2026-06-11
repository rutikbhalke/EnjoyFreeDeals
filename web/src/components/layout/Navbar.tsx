import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, LogOut, Shield, User, Tag, Store, Grid3X3, Plus, BookOpen, Sun, Moon, TrendingUp, Ticket } from "lucide-react";
import { useTheme } from "next-themes";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, profile, mobileSession, displayName, displayMobile, isMobileLoggedIn, isAdmin, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/deals?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";
  const isLoggedIn = Boolean(user || isMobileLoggedIn);
  const accountLabel = displayName || user?.email || mobileSession?.mobile || "User";

  return (
    <header className={`sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl transition-shadow duration-300 ${scrolled ? "shadow-md border-transparent" : "border-border"}`}>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="EnjoyFreeDeals" className="h-9" />
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 max-w-md mx-8 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"


              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search deals, stores, coupons..."
              className="h-10 w-full rounded-xl border border-border bg-secondary/50 pl-10 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-card"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">/</kbd>
          </div>
        </form>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" className="relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-3/4 after:rounded-full" asChild>
            <Link to="/deals">All Deals</Link>
          </Button>
          <Button variant="ghost" size="sm" className="relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-3/4 after:rounded-full" asChild>
            <Link to="/price-history">Price History</Link>
          </Button>
          <Button variant="ghost" size="sm" className="relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-3/4 after:rounded-full" asChild>
            <Link to="/coupons">Coupons</Link>
          </Button>
          <Button variant="ghost" size="sm" className="relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-3/4 after:rounded-full" asChild>
            <Link to="/stores">Stores</Link>
          </Button>
          <Button variant="ghost" size="sm" className="relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-3/4 after:rounded-full" asChild>
            <Link to="/categories">Categories</Link>
          </Button>
          <Button variant="ghost" size="sm" className="relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-3/4 after:rounded-full" asChild>
            <Link to="/blog">Blog</Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>

          {isLoggedIn ? (
            <>
              {user && (
                <Button variant="outline" size="sm" className="gap-1" asChild>
                  <Link to="/submit-deal"><Plus className="h-3.5 w-3.5" />Submit Deal</Link>
                </Button>
              )}
              <NotificationBell />
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <div className="truncate text-sm font-medium">{accountLabel}</div>
                  {displayMobile && <div className="truncate text-xs text-muted-foreground">{displayMobile}</div>}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2"><User className="h-4 w-4" />My Profile</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2"><Shield className="h-4 w-4" />Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <Button size="sm" className="ml-2" asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </nav>

        {/* Mobile menu */}
        <div className="flex items-center gap-2 md:hidden">
          {isLoggedIn ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <div className="truncate text-sm font-medium">{accountLabel}</div>
                  {displayMobile && <div className="truncate text-xs text-muted-foreground">{displayMobile}</div>}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2"><User className="h-4 w-4" />My Profile</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2"><Shield className="h-4 w-4" />Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="font-display">Menu</SheetTitle>
              <form onSubmit={handleSearch} className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search deals..."
                    className="h-10 w-full rounded-xl border border-border bg-secondary/50 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </form>
              <nav className="mt-6 flex flex-col gap-1">
                <Button variant="ghost" className="justify-start gap-3 h-11" asChild>
                  <Link to="/deals"><Tag className="h-4 w-4 text-primary" />All Deals</Link>
                </Button>
                <Button variant="ghost" className="justify-start gap-3 h-11" asChild>
                  <Link to="/price-history"><TrendingUp className="h-4 w-4 text-primary" />Price History</Link>
                </Button>
                <Button variant="ghost" className="justify-start gap-3 h-11" asChild>
                  <Link to="/coupons"><Ticket className="h-4 w-4 text-primary" />Coupons</Link>
                </Button>
                <Button variant="ghost" className="justify-start gap-3 h-11" asChild>
                  <Link to="/stores"><Store className="h-4 w-4 text-primary" />Stores</Link>
                </Button>
                <Button variant="ghost" className="justify-start gap-3 h-11" asChild>
                  <Link to="/categories"><Grid3X3 className="h-4 w-4 text-primary" />Categories</Link>
                </Button>
                <Button variant="ghost" className="justify-start gap-3 h-11" asChild>
                  <Link to="/blog"><BookOpen className="h-4 w-4 text-primary" />Blog</Link>
                </Button>
                {user && (
                  <Button variant="ghost" className="justify-start gap-3 h-11" asChild>
                    <Link to="/submit-deal"><Plus className="h-4 w-4 text-primary" />Submit Deal</Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="justify-start gap-3 h-11"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
