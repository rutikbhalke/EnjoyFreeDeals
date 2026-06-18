import { type ReactNode, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Database, RefreshCw, Search, Table2, XCircle } from "lucide-react";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAdminDatabaseTables, type AdminDatabaseTableStatus } from "@/lib/api";

export default function AdminDatabaseTables() {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-database-tables"],
    queryFn: fetchAdminDatabaseTables,
    retry: false,
  });

  const groups = useMemo(() => {
    const names = new Set((data?.tables || []).map((table) => table.group).filter(Boolean));
    return ["all", ...Array.from(names).sort()];
  }, [data?.tables]);

  const filteredTables = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (data?.tables || []).filter((table) => {
      const matchesSearch = !needle ||
        table.name.toLowerCase().includes(needle) ||
        table.group.toLowerCase().includes(needle) ||
        table.migration.toLowerCase().includes(needle);
      const matchesGroup = group === "all" || table.group === group;
      return matchesSearch && matchesGroup;
    });
  }, [data?.tables, group, search]);

  return (
    <div className="space-y-6">
      <SEO title="Database Tables - Admin" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold">Database Tables</h1>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Tables" value={data?.summary.total} icon={<Table2 className="h-4 w-4" />} />
        <Metric label="Ready" value={data?.summary.ok} icon={<CheckCircle className="h-4 w-4 text-primary" />} />
        <Metric label="Missing" value={data?.summary.missing} icon={<XCircle className="h-4 w-4 text-destructive" />} />
        <Metric label="Errors" value={data?.summary.error} icon={<AlertTriangle className="h-4 w-4 text-yellow-600" />} />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tables"
            className="pl-9"
          />
        </div>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groups.map((item) => (
              <SelectItem key={item} value={item}>{item === "all" ? "All groups" : item}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          Checked {data?.checkedAt ? formatDateTime(data.checkedAt) : "-"}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Rows</TableHead>
              <TableHead className="hidden md:table-cell">Migration</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Latency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading tables...</TableCell>
              </TableRow>
            ) : filteredTables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No tables found.</TableCell>
              </TableRow>
            ) : (
              filteredTables.map((table) => (
                <TableRow key={table.name}>
                  <TableCell>
                    <div className="font-medium">{table.name}</div>
                    {table.errorMessage && (
                      <div className="mt-1 max-w-[360px] truncate text-xs text-destructive">{table.errorMessage}</div>
                    )}
                  </TableCell>
                  <TableCell>{table.group}</TableCell>
                  <TableCell><StatusBadge table={table} /></TableCell>
                  <TableCell className="text-right">{formatCount(table.count)}</TableCell>
                  <TableCell className="hidden max-w-[320px] truncate text-sm text-muted-foreground md:table-cell">
                    {table.migration}
                  </TableCell>
                  <TableCell className="hidden text-right text-sm text-muted-foreground lg:table-cell">
                    {table.latencyMs} ms
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

function Metric({ label, value, icon }: { label: string; value?: number; icon: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value ?? "-"}</div>
    </div>
  );
}

function StatusBadge({ table }: { table: AdminDatabaseTableStatus }) {
  if (table.status === "ok") {
    return <Badge className="bg-primary text-primary-foreground">Ready</Badge>;
  }
  if (table.status === "missing") {
    return <Badge variant="destructive">Missing</Badge>;
  }
  return <Badge variant="outline">{table.errorCode || "Error"}</Badge>;
}

function formatCount(value: number | null) {
  return value === null ? "-" : Number(value).toLocaleString("en-IN");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
