import React, { useCallback, useEffect, useState } from "react";
import {
  FileText, Briefcase, Linkedin, RefreshCw, Unplug, Plug,
  History, CheckCircle, XCircle, AlertTriangle, Loader2,
  Clock, Pencil, Eye, EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import {
  platformConnectionService,
  type PlatformConnection,
  type PendingProfileChange,
  type PlatformConnectionsDashboard,
} from "../../services/platformConnectionService";
import { sessionService, type PortalPlatform } from "../../services/sessionService";

interface PlatformConnectionsPanelProps {
  compact?: boolean;
  onNavigateSettings?: () => void;
}

function platformIcon(platform: string) {
  switch (platform) {
    case "RESUME": return FileText;
    case "NAUKRI": return Briefcase;
    case "LINKEDIN": return Linkedin;
    default: return Plug;
  }
}

function platformLabel(platform: string) {
  switch (platform) {
    case "RESUME": return "Resume";
    case "NAUKRI": return "Naukri";
    case "LINKEDIN": return "LinkedIn";
    default: return platform;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function statusBadge(status?: string | null) {
  const s = (status || "NOT_CONNECTED").toUpperCase();
  if (s === "CONNECTED" || s === "SUCCESS") {
    return <Badge className="bg-chart-3/15 text-chart-3 border-0 text-[10px] h-5">Connected</Badge>;
  }
  if (s === "FAILED" || s === "ERROR") {
    return <Badge variant="destructive" className="text-[10px] h-5">Failed</Badge>;
  }
  if (s === "PENDING_APPROVAL" || s === "PARTIAL") {
    return <Badge className="bg-amber-500/15 text-amber-700 border-0 text-[10px] h-5">Needs Review</Badge>;
  }
  if (s === "SYNCING") {
    return <Badge variant="secondary" className="text-[10px] h-5">Syncing…</Badge>;
  }
  if (s === "DISCONNECTED") {
    return <Badge variant="outline" className="text-[10px] h-5">Disconnected</Badge>;
  }
  return <Badge variant="outline" className="text-[10px] h-5">Not Connected</Badge>;
}

export function PlatformConnectionsPanel({ compact = false }: PlatformConnectionsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<PlatformConnectionsDashboard | null>(null);
  const [pending, setPending] = useState<PendingProfileChange[]>([]);
  const [historyOpen, setHistoryOpen] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [editPlatform, setEditPlatform] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [connRes, pendingRes] = await Promise.all([
        platformConnectionService.getConnections(),
        platformConnectionService.getPendingChanges(),
      ]);

      if (connRes.success && connRes.data) {
        const payload = connRes.data as any;
        setDashboard({
          success: true,
          connections: payload.connections || payload.data?.connections || [],
          overallProfileCompletion: payload.overallProfileCompletion ?? 0,
          pendingApprovals: payload.pendingApprovals ?? 0,
          profileSyncEnabled: payload.profileSyncEnabled ?? true,
          lastProfileSyncAt: payload.lastProfileSyncAt,
        });
      }

      if (pendingRes.success && pendingRes.data) {
        const p = pendingRes.data as any;
        setPending(p.pendingChanges || p.data?.pendingChanges || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load platform connections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSync = async (platform: string) => {
    setSyncing(platform);
    try {
      const res = await platformConnectionService.sync(platform, platform !== "RESUME");
      if (res.success) {
        const data = res.data as any;
        toast.success(data?.message || `${platformLabel(platform)} synced`);
        if (data?.requiresApproval) {
          toast.message(`${data.conflictCount} field(s) need your approval before overwrite`);
        }
      } else {
        toast.error(res.error || res.message || "Sync failed");
      }
      await load();
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncing("ALL");
    try {
      const res = await platformConnectionService.syncAll();
      if (res.success) toast.success("All platforms synced (missing fields only)");
      else toast.error(res.error || "Sync failed");
      await load();
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Disconnect ${platformLabel(platform)}? Credentials will be cleared.`)) return;
    const res = await platformConnectionService.disconnect(platform);
    if (res.success) {
      toast.success(`${platformLabel(platform)} disconnected`);
      await load();
    } else {
      toast.error(res.error || "Disconnect failed");
    }
  };

  const handleSaveCredentials = async () => {
    if (!editPlatform || !email || !password) {
      toast.error("Email and password are required");
      return;
    }
    const platform = editPlatform;
    setSavingCreds(true);
    try {
      const res = await platformConnectionService.updateCredentials(platform, email, password);
      if (res.success) {
        toast.success(`${platformLabel(platform)} credentials saved`);
        setEditPlatform(null);
        setEmail("");
        setPassword("");
        await load();
        // Establish persistent portal session after credentials commit
        await establishPortalSession(platform);
        await load();
      } else {
        toast.error(res.error || res.message || "Failed to save credentials");
      }
    } finally {
      setSavingCreds(false);
    }
  };

  const establishPortalSession = async (platform: string) => {
    if (platform !== "NAUKRI" && platform !== "LINKEDIN") return;
    setLoggingIn(platform);
    try {
      const res = platform === "NAUKRI"
        ? await sessionService.loginNaukri()
        : await sessionService.loginLinkedIn();
      const status = res.data?.status || "";
      const message = res.data?.message || res.error || "";
      if (res.success && (status === "SUCCESS" || status === "success")) {
        toast.success(`${platformLabel(platform)} session established`, { description: message });
      } else if (status === "MANUAL_LOGIN_STARTED" || status === "LAUNCHED") {
        toast.info(`Complete ${platformLabel(platform)} login in the browser window`, {
          description: "Session will be saved automatically once you are signed in.",
          duration: 8000,
        });
      } else {
        toast.warning(`Could not auto-login to ${platformLabel(platform)}`, {
          description: message || "Try Login Session again after CAPTCHA/OTP if needed.",
        });
      }
    } finally {
      setLoggingIn(null);
    }
  };

  const handleRefreshSession = async (platform: string) => {
    if (platform !== "NAUKRI" && platform !== "LINKEDIN") return;
    setLoggingIn(platform);
    try {
      const refresh = await sessionService.refresh(platform as PortalPlatform);
      if (refresh.success && refresh.data?.success) {
        toast.success(`${platformLabel(platform)} session refreshed`);
        await load();
        return;
      }
      await establishPortalSession(platform);
      await load();
    } finally {
      setLoggingIn(null);
    }
  };

  const handleToggleSchedule = async (platform: string, enabled: boolean) => {
    const res = await platformConnectionService.updateSchedule(platform, enabled);
    if (res.success) {
      toast.success(enabled ? "Scheduled sync enabled" : "Scheduled sync disabled");
      await load();
    } else {
      toast.error(res.error || "Failed to update schedule");
    }
  };

  const openHistory = async (platform: string) => {
    if (historyOpen === platform) {
      setHistoryOpen(null);
      return;
    }
    const res = await platformConnectionService.getHistory(platform, 10);
    if (res.success && res.data) {
      const data = res.data as any;
      setHistoryItems(data.history || []);
      setHistoryOpen(platform);
    } else {
      toast.error("Failed to load sync history");
    }
  };

  const resolveChange = async (id: number, approve: boolean) => {
    const res = approve
      ? await platformConnectionService.approveChange(id)
      : await platformConnectionService.rejectChange(id);
    if (res.success) {
      toast.success(approve ? "Change applied" : "Change rejected");
      await load();
    } else {
      toast.error(res.error || "Failed to resolve change");
    }
  };

  const connections = dashboard?.connections || [];

  if (loading && !dashboard) {
    return (
      <Card className="border-border">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="animate-spin text-muted-foreground" size={20} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border">
        <CardHeader className={cn("pb-2", compact && "pb-1")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>
                Platform Connections
              </CardTitle>
              {!compact && (
                <CardDescription className="text-xs mt-1">
                  Resume is primary. Naukri / LinkedIn fill missing fields only — overwrites need your approval.
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {dashboard && (
                <span className="text-[11px] text-muted-foreground">
                  {dashboard.overallProfileCompletion}% complete
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                disabled={syncing !== null}
                onClick={() => void handleSyncAll()}
              >
                {syncing === "ALL" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Sync All
              </Button>
            </div>
          </div>
          {dashboard && (
            <Progress value={dashboard.overallProfileCompletion} className="h-1.5 mt-2" />
          )}
        </CardHeader>
        <CardContent className={cn("space-y-3", compact ? "pb-3" : "pb-4")}>
          {connections.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No platforms configured yet</p>
          )}

          {connections.map((conn: PlatformConnection) => {
            const Icon = platformIcon(conn.platform);
            const connected = conn.connectionStatus === "CONNECTED";
            return (
              <div key={conn.platform} className="rounded-xl border border-border p-3 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      connected ? "bg-chart-3/15" : "bg-muted/50"
                    )}>
                      <Icon size={14} className={connected ? "text-chart-3" : "text-muted-foreground"} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-medium text-foreground">{platformLabel(conn.platform)}</p>
                        {statusBadge(conn.connectionStatus)}
                        {conn.lastSyncResult && connected && statusBadge(conn.lastSyncResult) !== statusBadge(conn.connectionStatus) && (
                          <span className="text-[10px] text-muted-foreground">
                            Last: {conn.lastSyncResult}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {conn.accountEmail || (connected ? "Connected" : "Not connected")}
                        {conn.accountName ? ` · ${conn.accountName}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {!compact && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <div>Last sync: <span className="text-foreground">{formatDate(conn.lastSuccessfulSyncAt)}</span></div>
                    <div>Profile update: <span className="text-foreground">{formatDate(conn.lastProfileUpdateAt)}</span></div>
                    {conn.platform === "RESUME" && (
                      <div>Uploaded: <span className="text-foreground">{formatDate(conn.resumeUploadAt)}</span></div>
                    )}
                    <div>Fields synced: <span className="text-foreground">{conn.fieldsSyncedCount ?? 0}</span></div>
                    <div>Missing: <span className="text-foreground">{conn.fieldsMissingCount ?? 0}</span></div>
                    <div>Completion: <span className="text-foreground">{conn.profileCompletionPct ?? 0}%</span></div>
                    {conn.scheduledSyncEnabled && (
                      <div className="col-span-2 flex items-center gap-1">
                        <Clock size={11} />
                        Next sync: {formatDate(conn.nextScheduledSyncAt)}
                      </div>
                    )}
                    {conn.lastSyncError && (
                      <div className="col-span-2 text-destructive flex items-start gap-1">
                        <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                        {conn.lastSyncError}
                      </div>
                    )}
                  </div>
                )}

                {compact && connected && (
                  <p className="text-[10px] text-muted-foreground">
                    Synced {formatDate(conn.lastSuccessfulSyncAt)} · {conn.fieldsMissingCount ?? 0} missing
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-1.5">
                  {connected && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] gap-1"
                      disabled={syncing === conn.platform}
                      onClick={() => void handleSync(conn.platform)}
                    >
                      {syncing === conn.platform
                        ? <Loader2 size={11} className="animate-spin" />
                        : <RefreshCw size={11} />}
                      Sync
                    </Button>
                  )}
                  {connected && (conn.platform === "NAUKRI" || conn.platform === "LINKEDIN") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] gap-1"
                      disabled={loggingIn === conn.platform}
                      onClick={() => void handleRefreshSession(conn.platform)}
                    >
                      {loggingIn === conn.platform
                        ? <Loader2 size={11} className="animate-spin" />
                        : <Plug size={11} />}
                      Login Session
                    </Button>
                  )}
                  {conn.canEditCredentials && (
                    <Button
                      size="sm"
                      variant={connected ? "outline" : "default"}
                      className="h-7 text-[11px] gap-1"
                      onClick={() => {
                        setEditPlatform(conn.platform);
                        setEmail("");
                        setPassword("");
                      }}
                    >
                      {connected ? <Pencil size={11} /> : <Plug size={11} />}
                      {connected ? "Edit" : "Connect"}
                    </Button>
                  )}
                  {connected && conn.platform !== "RESUME" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] gap-1 text-destructive"
                      onClick={() => void handleDisconnect(conn.platform)}
                    >
                      <Unplug size={11} />
                      Disconnect
                    </Button>
                  )}
                  {!compact && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] gap-1"
                      onClick={() => void openHistory(conn.platform)}
                    >
                      <History size={11} />
                      History
                    </Button>
                  )}
                  {connected && conn.platform !== "RESUME" && !compact && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[10px] text-muted-foreground">Auto-sync</span>
                      <Switch
                        checked={!!conn.scheduledSyncEnabled}
                        onCheckedChange={(v) => void handleToggleSchedule(conn.platform, v)}
                      />
                    </div>
                  )}
                </div>

                {historyOpen === conn.platform && (
                  <div className="rounded-lg bg-muted/40 p-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {historyItems.length === 0 && (
                      <p className="text-[11px] text-muted-foreground text-center py-2">No sync history</p>
                    )}
                    {historyItems.map((h) => (
                      <div key={h.id} className="flex items-start justify-between gap-2 text-[11px]">
                        <div className="min-w-0">
                          <p className="text-foreground font-medium">{h.syncType} · {h.syncStatus}</p>
                          <p className="text-muted-foreground truncate">
                            {h.fieldsSynced || h.errorMessage || "—"}
                          </p>
                        </div>
                        <span className="text-muted-foreground shrink-0">{formatDate(h.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {editPlatform === conn.platform && (
                  <div className="rounded-lg border border-border p-3 space-y-2.5 bg-muted/20">
                    <p className="text-[12px] font-medium">
                      {connected ? "Update" : "Connect"} {platformLabel(conn.platform)} credentials
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Email</Label>
                      <Input
                        className="h-8 text-xs"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Must match your Gmail login"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Password</Label>
                      <div className="relative">
                        <Input
                          className="h-8 text-xs pr-8"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={savingCreds}
                        onClick={() => void handleSaveCredentials()}
                      >
                        {savingCreds ? <Loader2 size={11} className="animate-spin mr-1" /> : null}
                        Save & Sync
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setEditPlatform(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <Card className="border-border border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-600" />
              Pending Overwrite Approvals
            </CardTitle>
            <CardDescription className="text-xs">
              These fields already have values from Resume or your profile. Approve to replace them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {pending.map((change) => (
              <div key={change.id} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-medium text-foreground">
                    {change.fieldName}
                    <span className="text-muted-foreground font-normal"> · {platformLabel(change.platform)}</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded bg-muted/50 p-2">
                    <p className="text-muted-foreground mb-0.5">Current</p>
                    <p className="text-foreground break-words">{change.currentValue || "—"}</p>
                  </div>
                  <div className="rounded bg-primary/5 p-2">
                    <p className="text-muted-foreground mb-0.5">Proposed</p>
                    <p className="text-foreground break-words">{change.proposedValue || "—"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => void resolveChange(change.id, true)}
                  >
                    <CheckCircle size={11} /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => void resolveChange(change.id, false)}
                  >
                    <XCircle size={11} /> Keep current
                  </Button>
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={async () => {
                  await platformConnectionService.resolveAllPending(true);
                  toast.success("All changes approved");
                  await load();
                }}
              >
                Approve all
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={async () => {
                  await platformConnectionService.resolveAllPending(false);
                  toast.success("All changes rejected");
                  await load();
                }}
              >
                Reject all
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
