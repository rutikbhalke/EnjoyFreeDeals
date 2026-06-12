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
import { Wallet, Copy, Check, User, Save, TrendingUp, Send, ExternalLink, Clock, CheckCircle2, XCircle, ThumbsUp } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import SEO, { SITE_URL } from "@/components/SEO";
import { fetchUpvotedDeals } from "@/lib/api";
import { getUserId } from "@/lib/auth";

export default function ProfilePage() {
  const { user, profile, mobileSession, displayName, displayMobile, isMobileLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Keep form in sync when profile loads
  useState(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  });

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

  const upvotedUserId = isMobileLoggedIn ? getUserId() : "";
  const { data: upvotedDeals } = useQuery({
    queryKey: ["upvoted-deals", upvotedUserId],
    enabled: Boolean(upvotedUserId),
    queryFn: () => fetchUpvotedDeals(upvotedUserId),
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
        <div className="container max-w-2xl py-10 space-y-6">
          <Skeleton className="h-9 w-40" />
          <Card>
            <CardHeader className="flex-row items-center gap-4 space-y-0">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-9 w-32" />
            </CardContent>
          </Card>
          <Card><CardContent className="py-5"><Skeleton className="h-12 w-full" /></CardContent></Card>
          <Card><CardContent className="py-5"><Skeleton className="h-12 w-full" /></CardContent></Card>
          <Card><CardContent className="py-5"><Skeleton className="h-12 w-full" /></CardContent></Card>
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
      .eq("user_id", user.id);
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

  return (
    <MainLayout>
      <SEO title="My Profile" description="View and edit your EnjoyFreeDeals profile, wallet balance and referral code." canonical={`${SITE_URL}/profile`} noIndex />
      <div className="container max-w-2xl py-10 space-y-6">
        <h1 className="text-3xl font-bold font-display">My Profile</h1>

        {/* Profile Card */}
        <Card>
          <CardHeader className="flex-row items-center gap-4 space-y-0">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{profile?.full_name || mobileSession?.full_name || "User"}</CardTitle>
              <CardDescription>{user?.email || displayMobile || "Mobile OTP login"}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
            <Button onClick={handleSave} disabled={saving || !user} className="gap-2">
              <Save className="h-4 w-4" />{saving ? "Saving…" : "Save Changes"}
            </Button>
            {!user && (
              <p className="text-xs text-muted-foreground">Mobile OTP profile editing will be available after account sync.</p>
            )}
          </CardContent>
        </Card>

        {/* Wallet Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{wallet?.balance?.toFixed(2) ?? "0.00"}</p>
            <p className="text-sm text-muted-foreground mt-1">Available balance</p>
          </CardContent>
        </Card>

        {/* Savings Dashboard Link */}
        <Card>
          <CardContent className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Savings Dashboard</p>
                <p className="text-sm text-muted-foreground">Track how much you've saved</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/savings">View</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upvoted Deals */}
        <Card>
          <CardContent className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <ThumbsUp className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Upvoted Deals</p>
                <p className="text-sm text-muted-foreground">{upvotedDeals?.count ?? 0} deal{(upvotedDeals?.count ?? 0) === 1 ? "" : "s"} upvoted</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/profile/upvoted-deals">View</Link>
            </Button>
          </CardContent>
        </Card>

        {/* My Submissions */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" />My Submissions</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/submit-deal">Submit Deal</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                You haven't submitted any deals yet.
              </p>
            ) : (
              <div className="space-y-3">
                {submissions.map((deal: any) => {
                  const statusConfig = {
                    draft: { label: "Pending", icon: Clock, variant: "outline" as const, className: "text-yellow-600 border-yellow-600" },
                    active: { label: "Approved", icon: CheckCircle2, variant: "default" as const, className: "" },
                    expired: { label: "Rejected", icon: XCircle, variant: "secondary" as const, className: "" },
                  };
                  const sc = statusConfig[deal.status as keyof typeof statusConfig] ?? statusConfig.draft;
                  const StatusIcon = sc.icon;

                  return (
                    <div key={deal.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{deal.title}</p>
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

        {/* Referral Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Referral Code</CardTitle>
            <CardDescription>Share your code with friends to earn bonuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-lg px-4 py-2 font-mono tracking-wider">
                {profile?.referral_code ?? "—"}
              </Badge>
              <Button variant="outline" size="icon" onClick={copyReferral} disabled={!profile?.referral_code}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

