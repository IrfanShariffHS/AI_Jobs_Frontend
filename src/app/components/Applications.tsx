import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  KanbanSquare, List, Building2, MapPin, DollarSign,
  Calendar, MoreHorizontal, Eye, Trash2,
  MessageSquare, Plus, ExternalLink, RefreshCw, AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "./ui/dropdown-menu";
import { type Application, type JobStatus } from "./data";
import { cn } from "./ui/utils";
import { applicationService } from "../../services/applicationService";

const statusConfig: Record<JobStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
  count: number;
}> = {
  applied:    { label: "Applied",    color: "text-chart-2",    bg: "bg-chart-2/10",    border: "border-chart-2/30",  count: 0 },
  pending:    { label: "In Review",  color: "text-chart-4",    bg: "bg-chart-4/10",    border: "border-chart-4/30",  count: 0 },
  interview:  { label: "Interview",  color: "text-chart-1",    bg: "bg-chart-1/10",    border: "border-chart-1/30",  count: 0 },
  offer:      { label: "Offer",      color: "text-chart-3",    bg: "bg-chart-3/10",    border: "border-chart-3/30",  count: 0 },
  rejected:   { label: "Rejected",   color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", count: 0 },
  withdrawn:  { label: "Withdrawn",  color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border",     count: 0 },
  saved:      { label: "Saved",      color: "text-chart-5",    bg: "bg-chart-5/10",    border: "border-chart-5/30",  count: 0 },
};

const kanbanColumns: JobStatus[] = ["applied", "pending", "interview", "offer", "rejected"];

function StatusBadge({ status }: { status: JobStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", cfg.color, cfg.bg, cfg.border)}>
      {cfg.label}
    </span>
  );
}

function ApplicationCard({
  app,
  onMove,
  compact = false,
}: {
  app: Application;
  onMove: (app: Application, status: JobStatus) => void;
  compact?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
    >
      <Card className={cn(
        "border cursor-grab active:cursor-grabbing transition-all hover:border-primary/40",
        isDragging ? "opacity-50 border-primary/60" : "border-border"
      )}>
        <CardContent className="p-3">
          {/* Company + title */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Building2 size={13} className="text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-foreground truncate">{app.jobTitle}</p>
                <p className="text-[11px] text-muted-foreground">{app.company}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground p-0.5">
                  <MoreHorizontal size={13} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem className="text-xs gap-2"><Eye size={12} /> View Details</DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2"><MessageSquare size={12} /> Add Note</DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2"><ExternalLink size={12} /> Open Job</DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive">
                  <Trash2 size={12} /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <DollarSign size={9} /> {app.salary.split("–")[0].trim()}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MapPin size={9} /> {app.location}
            </span>
          </div>

          {/* Match score */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  app.matchScore >= 90 ? "bg-chart-3"
                    : app.matchScore >= 75 ? "bg-chart-2"
                    : "bg-chart-4"
                )}
                style={{ width: `${app.matchScore}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">{app.matchScore}%</span>
          </div>

          {/* Next step */}
          {app.nextStep && (
            <div className="mt-2 p-2 rounded-md bg-muted/50 border border-border/50">
              <p className="text-[10px] text-foreground font-medium">{app.nextStep}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
            <span className="text-[10px] text-muted-foreground">Applied {app.appliedAt}</span>
            {app.interviewDate && (
              <span className="flex items-center gap-1 text-[10px] text-chart-2 font-medium">
                <Calendar size={9} /> {app.interviewDate}
              </span>
            )}
            {app.offerAmount && (
              <span className="text-[10px] text-chart-3 font-semibold">{app.offerAmount}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function KanbanColumn({
  status,
  apps,
  onMove,
}: {
  status: JobStatus;
  apps: Application[];
  onMove: (app: Application, status: JobStatus) => void;
}) {
  const cfg = statusConfig[status];

  return (
    <div className="flex flex-col w-64 shrink-0 h-full">
      {/* Column header */}
      <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-t-xl border border-b-0", cfg.border, cfg.bg)}>
        <div className="flex items-center gap-2">
          <span className={cn("text-[12px] font-semibold", cfg.color)}>{cfg.label}</span>
          <span className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            cfg.color, cfg.bg, "border", cfg.border
          )}>
            {apps.length}
          </span>
        </div>
        <button className={cn("hover:opacity-80 transition-opacity", cfg.color)}>
          <Plus size={13} />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto rounded-b-xl border border-t-0 border-border/50 bg-muted/20 p-2 space-y-2 min-h-40">
        <AnimatePresence>
          {apps.map((app) => (
            <ApplicationCard key={app.id} app={app} onMove={onMove} />
          ))}
        </AnimatePresence>
        {apps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <KanbanSquare size={20} className="text-muted-foreground/40 mb-2" />
            <p className="text-[11px] text-muted-foreground/60">No applications</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ListView({ apps }: { apps: Application[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Position</th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Company</th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Salary</th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Applied</th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Match</th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Next Step</th>
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <tr key={app.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              <td className="py-3 px-4">
                <p className="text-[13px] font-medium text-foreground">{app.jobTitle}</p>
                <p className="text-[11px] text-muted-foreground sm:hidden">{app.company}</p>
              </td>
              <td className="py-3 px-4 hidden sm:table-cell text-[12px] text-muted-foreground">{app.company}</td>
              <td className="py-3 px-4 hidden md:table-cell text-[12px] text-muted-foreground">{app.salary}</td>
              <td className="py-3 px-4">
                <StatusBadge status={app.status} />
              </td>
              <td className="py-3 px-4 hidden lg:table-cell text-[12px] text-muted-foreground">{app.appliedAt}</td>
              <td className="py-3 px-4 hidden lg:table-cell">
                <span className={cn(
                  "text-[12px] font-semibold",
                  app.matchScore >= 90 ? "text-chart-3" : app.matchScore >= 75 ? "text-chart-2" : "text-chart-4"
                )}>
                  {app.matchScore}%
                </span>
              </td>
              <td className="py-3 px-4">
                {app.nextStep ? (
                  <p className="text-[11px] text-foreground max-w-[200px] truncate">{app.nextStep}</p>
                ) : (
                  <span className="text-[11px] text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-3 px-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal size={13} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-xs">View Details</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs">Add Note</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs text-destructive focus:text-destructive">Remove</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Applications() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<JobStatus | "all">("all");

  useEffect(() => {
    async function fetchApplications() {
      try {
        setLoading(true);
        const response = await applicationService.getApplications();
        if (response.success && response.data) {
          // Transform API data to match Application interface
          const transformedApps = (response.data.applications || []).map((apiApp: any): Application => ({
            id: String(apiApp.id),
            jobId: apiApp.jobId ? String(apiApp.jobId) : String(apiApp.id),
            jobTitle: apiApp.jobTitle,
            company: apiApp.company,
            status: mapApiStatusToJobStatus(apiApp.applicationStatus),
            appliedAt: apiApp.appliedAt ? new Date(apiApp.appliedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            lastUpdate: apiApp.lastUpdate ? new Date(apiApp.lastUpdate).toISOString().split('T')[0] : apiApp.appliedAt ? new Date(apiApp.appliedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            nextStep: apiApp.nextStep || undefined,
            notes: apiApp.notes || undefined,
            salary: apiApp.salary || "Not specified",
            location: apiApp.location || "Not specified",
            matchScore: apiApp.matchScore || 0,
            recruiterName: apiApp.recruiterName || undefined,
            interviewDate: apiApp.interviewDate || undefined,
            offerAmount: apiApp.offerAmount || undefined,
          }));
          setApps(transformedApps);
        } else {
          setError(response.error || 'Failed to load applications');
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchApplications();
  }, []);

  // Map API status to frontend JobStatus
  function mapApiStatusToJobStatus(apiStatus: string): JobStatus {
    const statusMap: Record<string, JobStatus> = {
      'APPLIED': 'applied',
      'PENDING': 'pending',
      'INTERVIEW': 'interview',
      'OFFER': 'offer',
      'REJECTED': 'rejected',
      'WITHDRAWN': 'withdrawn',
    };
    return statusMap[apiStatus] || 'pending';
  }

  const getAppsForStatus = (status: JobStatus) => apps.filter((a: Application) => a.status === status);

  const handleMove = (app: Application, newStatus: JobStatus) => {
    setApps((prev: Application[]) => prev.map((a: Application) => a.id === app.id ? { ...a, status: newStatus } : a));
  };

  const stats = {
    total: apps.length,
    applied: apps.filter((a: Application) => a.status === "applied").length,
    interview: apps.filter((a: Application) => a.status === "interview").length,
    offer: apps.filter((a: Application) => a.status === "offer").length,
    rejected: apps.filter((a: Application) => a.status === "rejected").length,
  };

  const filteredApps = activeFilter === "all" ? apps : apps.filter((a: Application) => a.status === activeFilter);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-muted-foreground mx-auto mb-3" size={32} />
          <p className="text-sm text-muted-foreground">Loading applications...</p>
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card/30 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex items-center gap-4 overflow-x-auto">
            {[
              { label: "Total", value: stats.total, color: "text-foreground" },
              { label: "Applied", value: stats.applied, color: "text-chart-2" },
              { label: "Interview", value: stats.interview, color: "text-chart-1" },
              { label: "Offer", value: stats.offer, color: "text-chart-3" },
              { label: "Rejected", value: stats.rejected, color: "text-destructive" },
            ].map((stat) => (
              <div key={stat.label} className="text-center shrink-0">
                <p className={cn("text-xl font-bold leading-none", stat.color)}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setView("kanban")}
                className={cn("px-3 py-1.5 text-xs transition-colors", view === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <KanbanSquare size={13} />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn("px-3 py-1.5 text-xs transition-colors", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <List size={13} />
              </button>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
              <Plus size={12} /> Add
            </Button>
          </div>
        </div>
      </div>

      {/* List view filter tabs */}
      {view === "list" && (
        <div className="px-6 py-2 border-b border-border bg-card/20 flex items-center gap-1 overflow-x-auto shrink-0">
          {(["all", ...kanbanColumns, "withdrawn"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status as JobStatus | "all")}
              className={cn(
                "shrink-0 text-[11px] font-medium px-3 py-1 rounded-full border transition-all",
                activeFilter === status
                  ? status === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : `${statusConfig[status as JobStatus].bg} ${statusConfig[status as JobStatus].color} ${statusConfig[status as JobStatus].border}`
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {status === "all" ? "All" : statusConfig[status as JobStatus].label}
              {" "}({status === "all" ? apps.length : apps.filter(a => a.status === status).length})
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === "kanban" ? (
          <div className="h-full flex gap-4 overflow-x-auto p-6">
            {kanbanColumns.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                apps={getAppsForStatus(status)}
                onMove={handleMove}
              />
            ))}
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <ListView apps={filteredApps} />
          </div>
        )}
      </div>
    </div>
  );
}
