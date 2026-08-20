import { useEffect, useState, useCallback, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Trash2, AlertTriangle, AlertCircle, Info, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type LogLevel = "info" | "warn" | "error" | "critical";

interface SystemLog {
  id: string;
  level: LogLevel;
  source: string;
  event_type: string;
  status_code: number | null;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const LEVEL_META: Record<LogLevel, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  info: { color: "bg-blue-500/15 text-blue-600 dark:text-blue-400", icon: Info },
  warn: { color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400", icon: AlertTriangle },
  error: { color: "bg-orange-500/15 text-orange-600 dark:text-orange-400", icon: AlertCircle },
  critical: { color: "bg-red-500/15 text-red-600 dark:text-red-400", icon: ShieldAlert },
};

export const SystemLogs = () => {
  const { isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    let query = (supabase as unknown as { from: (t: string) => any })
      .from("system_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (levelFilter !== "all") query = query.eq("level", levelFilter);
    if (sourceFilter !== "all") query = query.eq("source", sourceFilter);
    const { data, error } = await query;
    if (error) toast.error("Failed to load logs: " + error.message);
    else setLogs((data ?? []) as SystemLog[]);
    setLoading(false);
  }, [levelFilter, sourceFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("system_logs_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "system_logs" }, () => {
        loadLogs();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLogs]);

  const sources = Array.from(new Set(logs.map((l) => l.source)));

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this log entry?")) return;
    const { error } = await (supabase as unknown as { from: (t: string) => any })
      .from("system_logs")
      .delete()
      .eq("id", id);
    if (error) toast.error("Delete failed: " + error.message);
    else {
      toast.success("Log deleted");
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const counts = logs.reduce(
    (acc, l) => {
      acc[l.level] = (acc[l.level] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["critical", "error", "warn", "info"] as LogLevel[]).map((lvl) => {
          const M = LEVEL_META[lvl];
          const Icon = M.icon;
          return (
            <Card key={lvl} className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-md ${M.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{counts[lvl] ?? 0}</div>
                <div className="text-xs text-muted-foreground capitalize">{lvl}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Level</label>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Source</label>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={loadLogs} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>When</TableHead>
              {isSuperAdmin && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  No log entries.
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => {
              const M = LEVEL_META[log.level];
              return (
                <Fragment key={log.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >

                    <TableCell>
                      <Badge className={`${M.color} border-0 capitalize`}>{log.level}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.source}</TableCell>
                    <TableCell className="font-mono text-xs">{log.event_type}</TableCell>
                    <TableCell>{log.status_code ?? "—"}</TableCell>
                    <TableCell className="max-w-md truncate">{log.message}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                  {expanded === log.id && (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 7 : 6} className="bg-muted/30">
                        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-64">
{JSON.stringify(log.metadata ?? {}, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}

          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
