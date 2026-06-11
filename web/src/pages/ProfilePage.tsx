import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Wallet, Copy, Check, User, Save, TrendingUp, Send, ExternalLink,
  Clock, CheckCircle2, XCircle, Heart, Share2, Bell, History, ShoppingBag
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import DealCard from "@/components/deals/DealCard";
import SEO, { SITE_URL } from "@/components/SEO";

export default function ProfilePage() {
  const { user, profile, mobileSession, displayName, displayMobile, isMobileLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load recently viewed deals using the hook
  const { data: recentlyViewedDeals, isLoading: isRecentLoading } = useRecentlyViewed(8);

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["my-submissions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("id, title, slug, status, created_at, stores(name)")
        .eq("submitted_by", user!.id)
        .eq("source", "user")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Query saved deals / watchlist
  const { data: savedDeals = [], isLoading: isSavedLoading } = useQuery({
    queryKey: ["profile-saved-deals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("deal_watchlist")
          .select("*, deals(*, stores(*), categories(*))")
          .eq("user_id", user!.id);
        if (error) throw error;
        return data.map(item => item.deals).filter(Boolean) as any[];
      } catch (e) {
        console.warn("Failed to fetch deal watchlist:", e);
        return [];
      }
    },
  });

  // Query price alerts
  const { data: priceAlerts = [], isLoading: isAlertsLoading } = useQuery({
    queryKey: ["profile-price-alerts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("deal_watchlist")
          .select("*, deals(*, stores(*), categories(*))")
          .eq("user_id", user!.id)
          .not("target_price", "is", null);
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.warn("Failed to fetch price alerts:", e);
        return [];
      }
    },
  });

  // Query shared deals count/history
  const { data: sharedDeals = [], isLoading: isSharedLoading } = useQuery({
    queryKey: ["profile-shared-deals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("shared_deals" as any)
          .select("*, deals(*, stores(*), categories(*))" as any)
          .eq("user_id", user!.id);
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.warn("Failed to fetch shared deals:", e);
        return [];
      }
    },
  });

  const isLoading = !profile && !!user;

  if (!user && !isMobileLoggedIn) {
    navigate("/login");
    return null;
  }

  if (isLoading) {
    return (
      <MainLayout>
        <SEO title="My Profile" />
        <div className="container max-w-4xl py-10 space-y-6 px-5">
          <Skeleton className="h-9 w-40" />
          <div className="grid md:grid-cols-[240px_1fr] gap-6">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : displayName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, avatar_url: avatarUrl || null })
      .eq("user_id", user!.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
    }
  };

  const copyReferral = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const accountLabel = displayName || user?.email || mobileSession?.mobile || "User";

  return (
    <MainLayout>
      <SEO title="My Profile" description="View your EnjoyFreeDeals profile, price alerts, saved deals, and wallet balance." canonical={`${SITE_URL}/profile`} noIndex />

      <div className="container max-w-5xl py-8 px-5">
        {/* User Header Info */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <Avatar className="h-20 w-20 border-2 border-primary/20">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-xl font-bold bg-primary/5 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <h1 className="text-2xl font-bold font-display">{profile?.full_name || mobileSession?.full_name || "User"}</h1>
            <p className="text-sm text-muted-foreground">{user?.email || displayMobile || "Mobile OTP account"}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
              <Badge variant="outline" className="bg-secondary/40 text-[10px] uppercase font-bold">
                Wallet: ₹{wallet?.balance?.toFixed(2) ?? "0.00"}
              </Badge>
              {profile?.referral_code && (
                <Badge variant="outline" className="bg-secondary/40 text-[10px] uppercase font-bold">
                  Referral: {profile.referral_code}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Profile Tabs Layout */}
        <Tabs defaultValue="account" className="space-y-6">
          <div className="border-b border-border overflow-x-auto pb-px">
            <TabsList className="bg-transparent h-fit p-0 gap-6 border-b border-transparent w-full justify-start rounded-none">
              <TabsTrigger value="account" className="border-b-2 border-transparent rounded-none px-1 pb-3 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent shadow-none">
                <User className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger value="saved" className="border-b-2 border-transparent rounded-none px-1 pb-3 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent shadow-none">
                <Heart className="h-4 w-4 mr-2" />
                Saved Deals
              </TabsTrigger>
              <TabsTrigger value="alerts" className="border-b-2 border-transparent rounded-none px-1 pb-3 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent shadow-none">
                <Bell className="h-4 w-4 mr-2" />
                Price Alerts
              </TabsTrigger>
              <TabsTrigger value="shared" className="border-b-2 border-transparent rounded-none px-1 pb-3 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent shadow-none">
                <Share2 className="h-4 w-4 mr-2" />
                Shared Deals
              </TabsTrigger>
              <TabsTrigger value="recent" className="border-b-2 border-transparent rounded-none px-1 pb-3 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent shadow-none">
                <History className="h-4 w-4 mr-2" />
                Recently Viewed
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Account Tab Contents */}
          <TabsContent value="account" className="space-y-6 mt-0">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Form Settings */}
              <div className="md:col-span-2 space-y-6">
                <Card className="border border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-bold font-display">Profile Details</CardTitle>
                    <CardDescription>Update your personal display settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatarUrl">Avatar Image URL</Label>
                      <Input id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <Button onClick={handleSave} disabled={saving || !user} className="gap-2 font-semibold">
                      <Save className="h-4 w-4" />{saving ? "Saving…" : "Save Changes"}
                    </Button>
                    {!user && (
                      <p className="text-[10px] text-muted-foreground">Mobile OTP profile editing will be available after account sync.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Submissions list */}
                <Card className="border border-border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-base font-bold font-display">My Submissions</CardTitle>
                      <CardDescription>Deals you've submitted to the platform</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild className="font-semibold text-xs gap-1">
                      <Link to="/submit-deal">Submit Deal</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {submissions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground space-y-2">
                        <ShoppingBag className="h-8 w-8 mx-auto opacity-30" />
                        <p className="text-sm font-semibold">You haven't submitted any deals yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {submissions.map((deal: any) => {
                          const statusConfig = {
                            draft: { label: "Pending", icon: Clock, variant: "outline" as const, className: "text-yellow-600 border-yellow-600" },
                            active: { label: "Approved", icon: CheckCircle2, variant: "default" as const, className: "bg-emerald-500 hover:bg-emerald-500" },
                            expired: { label: "Rejected", icon: XCircle, variant: "secondary" as const, className: "" },
                          };
                          const sc = statusConfig[deal.status as keyof typeof statusConfig] ?? statusConfig.draft;
                          const StatusIcon = sc.icon;

                          return (
                            <div key={deal.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate text-foreground">{deal.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">{deal.stores?.name ?? "—"}</span>
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(deal.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant={sc.variant} className={`gap-1 ${sc.className}`}>
                                  <StatusIcon className="h-3 w-3" />{sc.label}
                                </Badge>
                                {deal.status === "active" && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <Link to={`/deals/${deal.slug}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Wallet and Referral sidebar */}
              <div className="space-y-6">
                <Card className="border border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-bold font-display flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-emerald-500" />
                      Cashback Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold font-display text-foreground">₹{wallet?.balance?.toFixed(2) ?? "0.00"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Credited after successful purchases</p>
                  </CardContent>
                </Card>

                <Card className="border border-border shadow-sm">
                  <CardHeader className="py-4">
                    <CardTitle className="text-base font-bold font-display flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Savings Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0">
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      Visualize how much money you have saved using our coupons and cashback.
                    </p>
                    <Button variant="outline" size="sm" asChild className="w-full font-semibold">
                      <Link to="/savings">View Savings Chart</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-bold font-display flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-primary" />
                      Referral Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">Share this code to get signup and purchase bonuses.</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm px-3 py-1.5 font-mono tracking-wider font-bold">
                        {profile?.referral_code ?? "—"}
                      </Badge>
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={copyReferral} disabled={!profile?.referral_code}>
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Saved Deals Content */}
          <TabsContent value="saved" className="mt-0">
            {isSavedLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            ) : savedDeals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {savedDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            ) : (
              <Card className="border border-border border-dashed shadow-none p-10 text-center bg-card/50">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <h3 className="font-display font-bold text-base mb-1">No saved deals yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4 leading-relaxed">
                  Add deals to your wishlist to keep track of their status and find them easily.
                </p>
                <Button size="sm" asChild>
                  <Link to="/deals">Browse Deals</Link>
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Price Alerts Content */}
          <TabsContent value="alerts" className="mt-0">
            {isAlertsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 rounded-xl w-full" />
                <Skeleton className="h-20 rounded-xl w-full" />
              </div>
            ) : priceAlerts.length > 0 ? (
              <div className="grid gap-3">
                {priceAlerts.map((alert: any) => (
                  <div key={alert.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-border bg-card rounded-xl shadow-sm">
                    <div>
                      <h4 className="font-semibold text-sm leading-snug">{alert.deals?.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Alert target: <span className="font-bold text-emerald-600">₹{alert.target_price}</span>
                      </p>
                    </div>
                    <Button size="sm" asChild className="shrink-0">
                      <Link to={`/deals/${alert.deals?.slug}`}>View Chart</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border border-border border-dashed shadow-none p-10 text-center bg-card/50">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <h3 className="font-display font-bold text-base mb-1">No price alerts created yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4 leading-relaxed">
                  Setup target price drop limits on any product details page to receive instant dashboard notifications.
                </p>
                <Button size="sm" asChild>
                  <Link to="/deals">Explore Deals</Link>
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Shared Deals Content */}
          <TabsContent value="shared" className="mt-0">
            {isSharedLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ) : sharedDeals.length > 0 ? (
              <div className="grid gap-3">
                {sharedDeals.map((sd: any) => (
                  <div key={sd.id} className="flex items-center justify-between p-4 border border-border bg-card rounded-xl shadow-sm">
                    <p className="text-sm font-semibold truncate max-w-md">{sd.deals?.title}</p>
                    <Badge variant="outline" className="text-xs">
                      Shared {new Date(sd.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border border-border border-dashed shadow-none p-10 text-center bg-card/50">
                <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <h3 className="font-display font-bold text-base mb-1">No shared deals yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4 leading-relaxed">
                  Referral shares are tracked. Share links from deal pages with your friends and earn rewards when they register.
                </p>
                <Button size="sm" asChild>
                  <Link to="/deals">Browse Deals</Link>
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Recently Viewed Content */}
          <TabsContent value="recent" className="mt-0">
            {isRecentLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            ) : recentlyViewedDeals && recentlyViewedDeals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {recentlyViewedDeals.map((deal: any) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            ) : (
              <Card className="border border-border border-dashed shadow-none p-10 text-center bg-card/50">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <h3 className="font-display font-bold text-base mb-1">No recently viewed deals yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Browse products and inspect price comparisons to see history trails of your activities here.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
