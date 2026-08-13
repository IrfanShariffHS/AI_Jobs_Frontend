import React, { useState, useEffect } from "react";
import {
  Clock, Play, Pause, RefreshCw, Calendar, CheckCircle2,
  XCircle, AlertTriangle, Activity, FileText, User, Mail,
  ChevronRight, ChevronDown, Terminal, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import { schedulerService, type ScheduleInfo } from "../../services/schedulerService";
import { autoApplyService } from "../../services/autoApplyService";

const iconForSchedule = (id: string) => {
  if (id.includes("resume")) return { icon: FileText, color: "text-chart-2", bg: "bg-chart-2/15" };
  if (id.includes("email")) return { icon: Mail, color: "text-chart-1", bg: "bg-chart-1/15" };
  if (id.includes("naukri")) return { icon: User, color: "text-chart-4", bg: "bg-chart-4/15" };
  return { icon: Calendar, color: "text-chart-3", bg: "bg-chart-3/15" };
};

export function Scheduler() {
  const [schedules, setSchedules] = useState<ScheduleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTimeline, setExpandedTimeline] = useState(false);
  const [activityLogs, setActivityLogs] = useState<{ time: string; event: string; type: "info" | "success" | "warning" | "failed" }[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadSchedules = async () => {
    const response = await schedulerService.getAllSchedules();
    if (response.success && response.data) {
      const payload = response.data as any;
      const list = Array.isArray(payload.schedules)
        ? payload.schedules
        : Array.isArray(payload.data?.schedules)
          ? payload.data.schedules
          : Array.isArray(payload)
            ? payload
            : [];
      setSchedules(list);
      return;
    }
    throw new Error(response.error || "Failed to load schedules");
  };

  useEffect(() => {
    async function fetchSchedules() {
      try {
        setLoading(true);
        await loadSchedules();

        // Use auto-apply logs as the execution timeline when available
        try {
          const status = await autoApplyService.getStatus();
          const logs = (status.data as any)?.logs || (status.data as any)?.recentLogs || [];
          if (Array.isArray(logs) && logs.length > 0) {
            setActivityLogs(logs.map((l: any) => ({
              time: l.time || l.timestamp || "",
              event: l.message || l.event || String(l),
              type: (l.type === "error" ? "failed" : l.type) || "info",
            })));
          } else {
            setActivityLogs([]);
          }
        } catch {
          setActivityLogs([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchSchedules();
  }, []);

  const toggleTask = async (schedule: ScheduleInfo, nextEnabled: boolean) => {
    const previous = schedules;
    setTogglingId(schedule.id);

    // Optimistic UI — flip immediately, reconcile with backend response
    setSchedules((list) =>
      list.map((s) =>
        s.id === schedule.id
          ? {
              ...s,
              enabled: nextEnabled,
              humanReadable: nextEnabled
                ? s.humanReadable === "Disabled (never executes)"
                  ? s.cronExpression
                  : s.humanReadable
                : "Disabled (never executes)",
              nextExecution: nextEnabled ? s.nextExecution : "",
            }
          : s
      )
    );

    try {
      const response = await schedulerService.toggleSchedule(schedule.id);

      if (!response.success) {
        setSchedules(previous);
        toast.error(response.error || "Failed to update schedule");
        return;
      }

      const updated = (response.data as any)?.schedule as ScheduleInfo | undefined;
      if (updated) {
        setSchedules((list) =>
          list.map((s) => (s.id === schedule.id ? { ...s, ...updated } : s))
        );
      } else {
        await loadSchedules();
      }

      toast[nextEnabled ? "success" : "info"](
        `${schedule.name} ${nextEnabled ? "enabled" : "disabled"}`
      );
    } catch {
      setSchedules(previous);
      toast.error("Failed to update schedule");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-muted-foreground mx-auto mb-3" size={32} />
          <p className="text-sm text-muted-foreground">Loading scheduler...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-destructive mx-auto mb-3" size={32} />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const activeCount = schedules.filter((t) => t.enabled).length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-[1000px] mx-auto space-y-6">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Active Tasks", value: activeCount, color: "text-chart-3" },
            { label: "Total Schedules", value: schedules.length, color: "text-chart-2" },
            { label: "Disabled", value: schedules.length - activeCount, color: "text-muted-foreground" },
            { label: "Activity Events", value: activityLogs.length, color: "text-chart-4" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="p-4">
                <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Scheduled Tasks</CardTitle>
                <CardDescription className="text-xs">Manage automated task schedule from backend config</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => loadSchedules().then(() => toast.success("Schedules refreshed"))}>
                <RefreshCw size={11} /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4 space-y-0">
            {schedules.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No schedules returned by the backend.</p>
            ) : schedules.map((task, i) => {
              const visual = iconForSchedule(task.id);
              const Icon = visual.icon;
              return (
                <React.Fragment key={task.id}>
                  <div className="py-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", visual.bg)}>
                        <Icon size={15} className={visual.color} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-semibold text-foreground">{task.name}</p>
                              {!task.enabled && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Disabled</Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{task.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Switch
                              checked={!!task.enabled}
                              disabled={togglingId === task.id}
                              aria-label={`${task.enabled ? "Disable" : "Enable"} ${task.name}`}
                              onCheckedChange={(checked) => toggleTask(task, checked)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                          <div className="bg-muted/40 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground">Schedule</p>
                            <p className="text-[11px] font-medium text-foreground mt-0.5">{task.humanReadable || task.cronExpression}</p>
                          </div>
                          <div className="bg-muted/40 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground">Next Run</p>
                            <p className={cn("text-[11px] font-medium mt-0.5", task.enabled ? "text-chart-2" : "text-muted-foreground")}>
                              {task.nextExecution || "—"}
                            </p>
                          </div>
                          <div className="bg-muted/40 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground">Cron</p>
                            <p className="text-[11px] font-mono text-foreground mt-0.5 truncate">{task.cronExpression}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {i < schedules.length - 1 && <Separator />}
                </React.Fragment>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Execution Timeline</CardTitle>
                <CardDescription className="text-xs">Recent automation activity from the backend</CardDescription>
              </div>
              <button
                onClick={() => setExpandedTimeline(!expandedTimeline)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {expandedTimeline ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
            </div>
          </CardHeader>
          {expandedTimeline && (
            <CardContent className="pb-4">
              <div className="bg-[oklch(0.07_0.015_264)] rounded-lg p-4 font-mono text-[11px] space-y-1.5">
                {activityLogs.length === 0 ? (
                  <p className="text-muted-foreground">No recent activity logs yet.</p>
                ) : activityLogs.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-muted-foreground/60 w-28 shrink-0">{entry.time}</span>
                    {entry.type === "success" ? <CheckCircle2 size={11} className="text-chart-3 mt-0.5" /> :
                      entry.type === "failed" ? <XCircle size={11} className="text-destructive mt-0.5" /> :
                      entry.type === "warning" ? <AlertTriangle size={11} className="text-chart-4 mt-0.5" /> :
                      <Activity size={11} className="text-muted-foreground mt-0.5" />}
                    <span className="text-foreground">{entry.event}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
