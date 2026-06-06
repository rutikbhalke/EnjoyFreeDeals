import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Search, Send, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export default function AdminSubmissions() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, stores(name), profiles!deals_submitted_by_fkey(full_name, email)")
        .eq("source", "user")
        .order("created_at", { ascending: false });
      if (error) {
        // Fallback without profile join if fkey doesn't exist
        const { data: fallback, error: err2 } = await supabase
          .from("deals")
          .select("*, stores(name)")
          .eq("source", "user")
          .order("created_at", { ascending: false });
        if (err2) throw err2;
        return fallback as any[];
      }
      return data as any[];
    },
  });

  const filtered = submissions.filter((d: any) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = submissions.filter((d: any) => d.status === "draft").length;
  const approvedCount = submissions.filter((d: any) => d.status === "active").length;
  const rejectedCount = submissions.filter((d: any) => d.status === "expired").length;

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("deals")
        .update({ status: "active" as any, is_verified: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-submissions"] });
      toast({ title: "Deal approved and published!" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("deals")
        .update({ status: "expired" as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-submissions"] });
      toast({ title: "Deal rejected" });
    },
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case "active":
        return <Badge variant="default">Approved</Badge>;
      case "expired":
        return <Badge variant="secondary">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="User Submissions – Admin" />
      <div className="flex items-center gap-2">
        <Send className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-bold">User Submissions</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Approved</p>
          <p className="text-2xl font-bold text-primary">{approvedCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Rejected</p>
          <p className="text-2xl font-bold text-destructive">{rejectedCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Store</TableHead>
              <TableHead className="hidden lg:table-cell">Submitted By</TableHead>
              <TableHead className="hidden lg:table-cell">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No user submissions found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((deal: any) => (
                <TableRow key={deal.id}>
                  <TableCell className="max-w-[200px] truncate font-medium">
                    {deal.title}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {deal.stores?.name ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {deal.profiles?.full_name || deal.profiles?.email || "Unknown"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {deal.discounted_price != null ? `₹${deal.discounted_price}` : "—"}
                    {deal.original_price != null && (
                      <span className="ml-1 text-xs text-muted-foreground line-through">
                        ₹{deal.original_price}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(deal.status)}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {format(new Date(deal.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {deal.affiliate_link && (
                        <Button variant="ghost" size="icon" title="View link" asChild>
                          <a href={deal.affiliate_link} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {deal.status === "draft" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Approve"
                            onClick={() => approveMutation.mutate(deal.id)}
                          >
                            <CheckCircle className="h-4 w-4 text-primary" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Reject">
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject this deal?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  The deal will be marked as rejected and won't appear publicly.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => rejectMutation.mutate(deal.id)}>
                                  Reject
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
