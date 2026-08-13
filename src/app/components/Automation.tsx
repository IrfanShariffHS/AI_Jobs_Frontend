import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play, Square, RefreshCw, Zap, CircleCheck,
  XCircle, AlertTriangle, Clock, Activity,
  CheckCircle2, SkipForward, Terminal,
  AlertCircle, ClipboardList, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import {
  autoApplyService,
  type AutoApplyLog,
  type AutoApplySettings,
  type AutoApplyStats,
  type ReviewJob,
} from "../../services/autoApplyService";
import { sessionService } from "../../services/sessionService";

function formatPlatform(platform?: string | null) {
  if (!platform || platform === "NONE" || platform === "COMPLETED") return null;
  if (platform.includes("NAUKRI")) return "Naukri";
  if (platform.includes("LINKEDIN")) return "LinkedIn";
  if (platform === "INITIALIZING") return "Initializing";
  return platform;
}

function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string; value: number | string; icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", bg)}>
          <Icon size={16} className={color} />
        </div>
        <div>
          <p className="text-xl font-bold text-foreground leading-none">{value}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LogEntry({ log }: { log: AutoApplyLog }) {
  const level = log.type || log.level || "info";
  const time = log.time || log.timestamp || "";
  const colors: Record<string, string> = {
    info: "text-muted-foreground",
    success: "text-chart-3",
    error: "text-destructive",
    warning: "text-chart-4",
  };
  const icons: Record<string, React.ElementType> = {
    info: Activity,
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
  };
  const Icon = icons[level] || Activity;
  const platformLabel = formatPlatform(log.platform);
  return (
    <div className={cn("flex items-start gap-3 py-1.5 font-mono text-[11px]", colors[level] || colors.info)}>
      <span className="text-muted-foreground/60 shrink-0 w-14">{time}</span>
      <Icon size={11} className="mt-0.5 shrink-0" />
      <span className="min-w-0">
        {platformLabel && (
          <span className="text-muted-foreground/80 mr-1.5">[{platformLabel}]</span>
        )}
        {log.message}
      </span>
    </div>
  );
}

function MatchScoreBadge({ score, threshold }: { score: number; threshold: number }) {
  const above = score > threshold;
  return (
    <span className={cn(
      "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
      above
        ? "text-chart-3 bg-chart-3/15 border-chart-3/30"
        : "text-chart-4 bg-chart-4/15 border-chart-4/30"
    )}>
      {score}% match
    </span>
  );
}

export function Automation() {
  const [isRunning, setIsRunning] = useState(false);
  const [statusLabel, setStatusLabel] = useState("STOPPED");
  const [message, setMessage] = useState("");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [logs, setLogs] = useState<AutoApplyLog[]>([]);
  const [stats, setStats] = useState<AutoApplyStats>({ applied: 0, pendingReview: 0, failed: 0, skipped: 0 });
  const [settings, setSettings] = useState<AutoApplySettings | null>(null);
  const [progress, setProgress] = useState({
    processed: 0, total: 0, applied: 0, pendingReview: 0, failed: 0,
    jobsFound: 0, applicationsSubmitted: 0, successfulApplications: 0,
    failedApplications: 0, skippedJobs: 0, remainingQuota: 0, dailyLimit: 0,
  });
  const [currentPlatform, setCurrentPlatform] = useState<string | null>(null);
  const [platformStats, setPlatformStats] = useState<Record<string, number>>({});
  const [sessionReady, setSessionReady] = useState<{ naukri: boolean; linkedIn: boolean } | null>(null);
  const [reviewJobs, setReviewJobs] = useState<ReviewJob[]>([]);
  const [matchThreshold, setMatchThreshold] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadReviewJobs = useCallback(async () => {
    const response = await autoApplyService.getReviewJobs();
    if (response.success && response.data) {
      setReviewJobs(response.data.jobs || []);
      if (response.data.matchThreshold != null) {
        setMatchThreshold(response.data.matchThreshold);
      }
    }
  }, []);

  const loadSessionReadiness = useCallback(async () => {
    const response = await sessionService.checkAutoApplyReady();
    if (response.success && response.data) {
      setSessionReady({
        naukri: !!response.data.naukriValid,
        linkedIn: !!response.data.linkedInValid,
      });
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    const response = await autoApplyService.getStatus();
    if (!response.success || !response.data) {
      setError(response.error || "Failed to load automation status");
      return;
    }

    const data = response.data;
    setError(null);
    setIsRunning(!!data.isRunning);
    setStatusLabel(data.status || (data.isRunning ? "RUNNING" : "STOPPED"));
    setMessage(data.message || "");
    setStartedAt(data.startedAt || null);
    setCurrentPlatform(data.currentPlatform || null);
    setLogs(data.logs || data.activityLogs || []);
    if (data.progress) {
      setProgress((prev) => ({ ...prev, ...data.progress }));
    }
    if (data.stats) setStats(data.stats);
    if (data.platformStats) setPlatformStats(data.platformStats);
    if (data.settings) {
      setSettings(data.settings);
      setMatchThreshold(data.settings.minMatchScore);
    }

    if (!data.isRunning) {
      await loadReviewJobs();
      await loadSessionReadiness();
    }
  }, [loadReviewJobs, loadSessionReadiness]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      await refreshStatus();
      await loadReviewJobs();
      await loadSessionReadiness();
      if (!cancelled) setLoading(false);
    }
    init();
    return () => { cancelled = true; };
  }, [refreshStatus, loadReviewJobs, loadSessionReadiness]);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (!isRunning) return;

    pollRef.current = setInterval(() => {
      refreshStatus();
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isRunning, refreshStatus]);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const response = await autoApplyService.start();
      if (!response.success) {
        toast.error("Failed to start", { description: response.error || response.data?.message });
        return;
      }
      toast.success("Auto Apply started", {
        description: "Naukri first, then LinkedIn — sessions restored automatically when valid.",
      });
      setIsRunning(true);
      await refreshStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    try {
      const response = await autoApplyService.stop();
      if (!response.success) {
        toast.error("Failed to stop", { description: response.error });
        return;
      }
      toast.warning("Auto Apply stopped");
      setIsRunning(false);
      await refreshStatus();
      await loadReviewJobs();
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === reviewJobs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reviewJobs.map(j => j.id)));
    }
  };

  const handleApprove = async () => {
    if (selectedIds.size === 0) {
      toast.info("Select at least one job to approve");
      return;
    }
    setApproving(true);
    try {
      const response = await autoApplyService.approveJobs(Array.from(selectedIds));
      if (!response.success || !response.data) {
        toast.error("Approval failed", { description: response.error });
        return;
      }
      toast.success(response.data.message || "Applications submitted");
      setSelectedIds(new Set());
      await loadReviewJobs();
      await refreshStatus();
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (selectedIds.size === 0) {
      toast.info("Select at least one job to dismiss");
      return;
    }
    setApproving(true);
    try {
      const response = await autoApplyService.rejectJobs(Array.from(selectedIds));
      if (!response.success) {
        toast.error("Dismiss failed", { description: response.error });
        return;
      }
      toast.success(response.data?.message || "Jobs dismissed");
      setSelectedIds(new Set());
      await loadReviewJobs();
      await refreshStatus();
    } finally {
      setApproving(false);
    }
  };

  const threshold = matchThreshold ?? settings?.minMatchScore ?? 0;

  const dailyLimit = progress.dailyLimit || settings?.dailyApplicationLimit || 0;
  const applicationsToday = progress.applicationsSubmitted
    ?? settings?.applicationsToday
    ?? progress.applied
    ?? stats.applied;
  const remainingQuota = progress.remainingQuota
    ?? Math.max(0, dailyLimit - (typeof applicationsToday === "number" ? applicationsToday : 0));
  const progressPct = dailyLimit > 0
    ? Math.min(100, Math.round(((dailyLimit - remainingQuota) / dailyLimit) * 100))
    : 0;
  const activePlatform = formatPlatform(currentPlatform);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-muted-foreground mx-auto mb-3" size={32} />
          <p className="text-sm text-muted-foreground">Loading automation data…</p>
        </div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-destructive mx-auto mb-3" size={32} />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => refreshStatus()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-[1200px] mx-auto space-y-6">

        <Card className="border-border overflow-hidden">
          <div className="relative p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Zap size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">AI Job Automation Engine</h3>
                    <p className="text-xs text-muted-foreground">
                      {`Naukri first, then LinkedIn · auto-apply >${threshold || "threshold"}% · sessions stay signed in`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm gap-3 flex-wrap">
                    <span className="text-muted-foreground">Daily progress</span>
                    <span className="font-mono font-semibold text-foreground">
                      {applicationsToday} / {dailyLimit || "—"} · {remainingQuota} remaining
                    </span>
                  </div>
                  <div className="w-full sm:w-80 h-2.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {activePlatform && isRunning && (
                      <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary">
                        Processing {activePlatform}
                      </Badge>
                    )}
                    {sessionReady && (
                      <>
                        <span className={sessionReady.naukri ? "text-chart-3" : "text-chart-4"}>
                          Naukri {sessionReady.naukri ? "session OK" : "login needed"}
                        </span>
                        <span>·</span>
                        <span className={sessionReady.linkedIn ? "text-chart-3" : "text-muted-foreground"}>
                          LinkedIn {sessionReady.linkedIn ? "session OK" : "optional"}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {message || (isRunning ? "Running sequential auto-apply…" : "Idle — start a run to search and apply")}
                    {startedAt && isRunning ? ` • Started ${new Date(startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  {isRunning ? (
                    <Button onClick={handleStop} variant="destructive" size="sm" className="gap-1.5 h-9" disabled={actionLoading}>
                      <Square size={13} /> Stop
                    </Button>
                  ) : (
                    <Button onClick={handleStart} size="sm" className="gap-1.5 h-9" disabled={actionLoading}>
                      <Play size={13} /> Start Auto Apply
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-9"
                    onClick={async () => { await refreshStatus(); await loadReviewJobs(); }}
                  >
                    <RefreshCw size={13} /> Refresh
                  </Button>
                </div>

                <div className={cn(
                  "flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full border",
                  isRunning ? "border-chart-3/30 text-chart-3 bg-chart-3/10"
                    : statusLabel === "FAILED" ? "border-destructive/30 text-destructive bg-destructive/10"
                    : "border-border text-muted-foreground bg-muted/30"
                )}>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isRunning ? "bg-chart-3 animate-pulse"
                      : statusLabel === "FAILED" ? "bg-destructive"
                      : "bg-muted-foreground"
                  )} />
                  {isRunning ? "Running" : statusLabel === "COMPLETED" ? "Completed" : statusLabel === "FAILED" ? "Failed" : "Stopped"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Jobs Found" value={progress.jobsFound || 0} icon={Activity} color="text-chart-2" bg="bg-chart-2/15" />
          <StatCard label="Submitted" value={progress.applicationsSubmitted || stats.applied} icon={Zap} color="text-primary" bg="bg-primary/15" />
          <StatCard label="Successful" value={progress.successfulApplications || stats.applied} icon={CheckCircle2} color="text-chart-3" bg="bg-chart-3/15" />
          <StatCard label="Failed" value={progress.failedApplications || stats.failed} icon={XCircle} color="text-destructive" bg="bg-destructive/15" />
          <StatCard label="Skipped" value={progress.skippedJobs || stats.skipped} icon={SkipForward} color="text-muted-foreground" bg="bg-muted/50" />
          <StatCard label="Quota Left" value={remainingQuota} icon={Clock} color="text-chart-4" bg="bg-chart-4/15" />
        </div>

        {(platformStats.naukri != null || platformStats.linkedin != null) && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>Platform totals:</span>
            <Badge variant="outline" className="text-[10px] h-5">Naukri {platformStats.naukri ?? 0}</Badge>
            <Badge variant="outline" className="text-[10px] h-5">LinkedIn {platformStats.linkedin ?? 0}</Badge>
            <Badge variant="outline" className="text-[10px] h-5">Pending review {stats.pendingReview}</Badge>
          </div>
        )}

        <Tabs defaultValue="review">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="review" className="text-xs gap-1.5">
                <ClipboardList size={12} /> Review Queue
                <Badge className="ml-1 h-4 text-[9px] bg-chart-4/20 text-chart-4 border-0 px-1">
                  {reviewJobs.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs gap-1.5">
                <Terminal size={12} /> Activity Log
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="review" className="space-y-3 mt-0">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      Jobs at or below {threshold || "—"}% match
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      These were not auto-applied. Select jobs to approve and submit applications.
                    </p>
                  </div>
                  {reviewJobs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={toggleSelectAll}>
                        {selectedIds.size === reviewJobs.length ? "Deselect all" : "Select all"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={selectedIds.size === 0 || approving}
                        onClick={handleReject}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        disabled={selectedIds.size === 0 || approving || isRunning}
                        onClick={handleApprove}
                      >
                        {approving ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Approve & Apply ({selectedIds.size})
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-2">
                {reviewJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <CircleCheck size={32} className="text-chart-3 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">No jobs awaiting review</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Run Auto Apply to search and score jobs. Matches at or under {threshold || "the configured threshold"}% appear here with improvement suggestions.
                    </p>
                  </div>
                ) : (
                  reviewJobs.map((job) => (
                    <div
                      key={job.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/20 transition-colors",
                        selectedIds.has(job.id) && "bg-primary/5 border-primary/30"
                      )}
                    >
                      <Checkbox
                        checked={selectedIds.has(job.id)}
                        onCheckedChange={() => toggleSelect(job.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] font-semibold text-foreground">{job.title}</p>
                          <MatchScoreBadge score={job.matchScore ?? 0} threshold={threshold} />
                          {job.platform && (
                            <Badge variant="outline" className="text-[10px] h-5">{job.platform}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {job.company}
                          {job.location ? ` · ${job.location}` : ""}
                          {job.salary ? ` · ${job.salary}` : ""}
                        </p>
                        {job.matchAnalysis && (
                          <p className="text-[11px] text-muted-foreground/90 line-clamp-2">{job.matchAnalysis}</p>
                        )}
                        {job.autoApplyReason && (
                          <p className="text-[10px] text-muted-foreground line-clamp-2">{job.autoApplyReason}</p>
                        )}
                        {job.matchingSkills && job.matchingSkills.length > 0 && (
                          <p className="text-[10px] text-chart-3">
                            Matching: {job.matchingSkills.slice(0, 6).join(", ")}
                            {job.matchingSkills.length > 6 ? "…" : ""}
                          </p>
                        )}
                        {job.missingSkills && job.missingSkills.length > 0 && (
                          <p className="text-[10px] text-chart-4">
                            Missing: {job.missingSkills.slice(0, 6).join(", ")}
                            {job.missingSkills.length > 6 ? "…" : ""}
                          </p>
                        )}
                        {job.profileImprovements && job.profileImprovements.length > 0 && (
                          <ul className="text-[10px] text-muted-foreground list-disc pl-4 space-y-0.5">
                            {job.profileImprovements.slice(0, 3).map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        )}
                        {(job.atsCompatibility != null || job.experienceMatch != null) && (
                          <p className="text-[10px] text-muted-foreground/80">
                            {job.experienceMatch != null ? `Exp ${job.experienceMatch}%` : ""}
                            {job.educationMatch != null ? ` · Edu ${job.educationMatch}%` : ""}
                            {job.atsCompatibility != null ? ` · ATS ${job.atsCompatibility}%` : ""}
                            {job.keywordMatch != null ? ` · Keywords ${job.keywordMatch}%` : ""}
                          </p>
                        )}
                      </div>
                      {job.jobUrl && (
                        <a
                          href={job.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground shrink-0 mt-1"
                          title="Open job"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 bg-[oklch(0.07_0.015_264)] max-h-80 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal size={12} className="text-muted-foreground" />
                    <span className="text-[11px] font-medium text-muted-foreground">Live Activity Log</span>
                    {isRunning && <Clock size={11} className="text-chart-2 animate-pulse" />}
                  </div>
                  {logs.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground font-mono py-4">
                      No activity yet. Start Auto Apply to see AI analysis and application logs.
                    </p>
                  ) : (
                    logs.map((log, i) => <LogEntry key={`${log.time}-${i}`} log={log} />)
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Automation Settings</CardTitle>
            <p className="text-xs text-muted-foreground">Loaded from your profile preferences and system configuration</p>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  label: "Min Match Score",
                  value: `${settings?.minMatchScore ?? threshold ?? "—"}%`,
                  hint: "Auto-apply only at or above this AI score",
                },
                {
                  label: "Daily Application Limit",
                  value: settings ? `${settings.dailyApplicationLimit} jobs` : "—",
                  hint: "Maximum applications per day",
                },
                {
                  label: "Target Platforms",
                  value: settings?.platforms?.length ? settings.platforms.join(", ") : "Not configured",
                  hint: "Active job boards from your credentials",
                },
                {
                  label: "Location Preference",
                  value: settings?.locationPreference || "From profile",
                  hint: "Target locations for job search",
                },
                {
                  label: "Cover Letter",
                  value: settings?.coverLetter || "AI Generated",
                  hint: "Personalized per job via AI",
                },
                {
                  label: "Auto Apply Enabled",
                  value: settings?.autoApplyEnabled ? "Yes" : "No",
                  hint: "Preference flag in your job settings",
                },
              ].map((setting) => (
                <div key={setting.label} className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-1">
                  <p className="text-[11px] text-muted-foreground">{setting.label}</p>
                  <p className="text-[13px] font-medium text-foreground">{setting.value}</p>
                  <p className="text-[10px] text-muted-foreground/70">{setting.hint}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
