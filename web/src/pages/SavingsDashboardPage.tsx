import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSavingsDashboard } from "@/hooks/useSavingsDashboard";
import MainLayout from "@/components/layout/MainLayout";
import SEO, { SITE_URL } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, IndianRupee, ShoppingBag, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
];

function formatMonth(ym: string) {
  const [y, m] = ym.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[+m - 1]} ${y.slice(2)}`;
}

export default function SavingsDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useSavingsDashboard();

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <MainLayout>
      <SEO title="My Savings" description="Track your savings from deals on EnjoyFreeDeals" canonical={`${SITE_URL}/savings`} noIndex />
      <div className="container mx-auto max-w-4xl px-5 py-8">
        <Button variant="ghost" size="sm" className="mb-4 gap-1" asChild>
          <Link to="/profile"><ArrowLeft className="h-4 w-4" />Back to Profile</Link>
        </Button>

        <h1 className="font-display text-2xl font-bold mb-6">My Savings Dashboard</h1>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : !data || data.totalDeals === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold font-display mb-1">No savings yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Click on deals to start tracking your savings!
              </p>
              <Button asChild>
                <Link to="/deals">Browse Deals</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />Total Saved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">₹{data.totalSavings.toLocaleString("en-IN")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />Deals Used
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{data.totalDeals}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />Avg. Saving
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    ₹{Math.round(data.totalSavings / data.totalDeals).toLocaleString("en-IN")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Chart */}
            {data.monthlySavings.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-base">Monthly Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.monthlySavings.map((m) => ({ ...m, label: formatMonth(m.month) }))}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="label" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `₹${v}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Savings"]}
                        />
                        <Bar dataKey="savings" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Breakdowns */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* By Store */}
              {data.byStore.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Store</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.byStore.map((s, i) => (
                      <div key={s.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <span className="text-sm truncate">{s.name}</span>
                          <span className="text-xs text-muted-foreground">({s.count})</span>
                        </div>
                        <span className="text-sm font-semibold shrink-0">₹{s.savings.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* By Category */}
              {data.byCategory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Category</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.byCategory.map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <span className="text-sm truncate">{c.name}</span>
                          <span className="text-xs text-muted-foreground">({c.count})</span>
                        </div>
                        <span className="text-sm font-semibold shrink-0">₹{c.savings.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
