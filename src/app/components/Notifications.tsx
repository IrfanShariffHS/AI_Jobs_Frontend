import React, { useState, useEffect } from "react";
import {
  Bell, Brain, FileText, Clock, Mail, Settings, CheckCheck,
  Trash2, Circle, Briefcase, AlertTriangle, RefreshCw, AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { type Notification } from "./data";
import { cn } from "./ui/utils";
import { notificationService } from "../../services/notificationService";

const typeConfig = {
  job:       { label: "Jobs",      icon: Briefcase,   color: "text-chart-1",    bg: "bg-chart-1/15" },
  ai:        { label: "AI",        icon: Brain,       color: "text-primary",    bg: "bg-primary/15" },
  resume:    { label: "Resume",    icon: FileText,    color: "text-chart-2",    bg: "bg-chart-2/15" },
  scheduler: { label: "Scheduler", icon: Clock,       color: "text-chart-4",    bg: "bg-chart-4/15" },
  email:     { label: "Email",     icon: Mail,        color: "text-chart-3",    bg: "bg-chart-3/15" },
  system:    { label: "System",    icon: Settings,    color: "text-muted-foreground", bg: "bg-muted/50" },
};

const priorityDot = {
  high:   "bg-destructive",
  medium: "bg-chart-4",
  low:    "bg-muted-foreground",
};

function NotificationItem({
  notif,
  onMarkRead,
  onDelete,
}: {
  notif: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = typeConfig[notif.type];
  const Icon = cfg.icon;
  const timeAgo = notif.timestamp;

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-xl border transition-all hover:border-border cursor-pointer group",
      notif.read ? "border-border/30 bg-transparent" : "border-primary/20 bg-primary/3"
    )}>
      {/* Priority dot */}
      <div className="relative mt-1 shrink-0">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", cfg.bg)}>
          <Icon size={15} className={cfg.color} />
        </div>
        {!notif.read && (
          <span className={cn("absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background", priorityDot[notif.priority])} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-[13px] font-medium", notif.read ? "text-foreground/80" : "text-foreground")}>
          {notif.title}
        </p>
        <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{notif.message}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1.5">
          {new Date(notif.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notif.read && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead(notif.id); }}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Mark as read"
          >
            <CheckCheck size={13} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);
        const response = await notificationService.getNotifications();
        if (response.success && response.data) {
          // Transform API data to match Notification interface
          const transformedNotifications = (response.data.notifications || []).map((apiNotif: any): Notification => ({
            id: String(apiNotif.id),
            type: apiNotif.type || "system",
            title: apiNotif.title || "Notification",
            message: apiNotif.message || "",
            timestamp: apiNotif.createdAt || new Date().toISOString(),
            read: apiNotif.read || false,
            priority: apiNotif.priority || "medium",
          }));
          setNotifications(transformedNotifications);
        } else {
          setError(response.error || 'Failed to load notifications');
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  const unread = notifications.filter((n: Notification) => !n.read);

  const markRead = (id: string) => setNotifications((prev: Notification[]) => prev.map((n: Notification) => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications((prev: Notification[]) => prev.map((n: Notification) => ({ ...n, read: true })));
  const deleteNotif = (id: string) => setNotifications((prev: Notification[]) => prev.filter((n: Notification) => n.id !== id));

  const getFiltered = (tab: string) => {
    if (tab === "all") return notifications;
    if (tab === "unread") return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === tab);
  };

  const filtered = getFiltered(activeTab);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-muted-foreground mx-auto mb-3" size={32} />
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
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
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-[800px] mx-auto space-y-4">

        {/* Header actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {unread.length > 0 ? `${unread.length} unread` : "All caught up"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {unread.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={markAllRead}>
                <CheckCheck size={12} /> Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive">
              <Trash2 size={12} /> Clear all
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 h-8 w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" className="text-xs gap-1.5">
              All
              {notifications.length > 0 && (
                <Badge className="h-4 min-w-4 text-[9px] px-1 bg-muted text-muted-foreground border-0">
                  {notifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs gap-1.5">
              Unread
              {unread.length > 0 && (
                <Badge className="h-4 min-w-4 text-[9px] px-1 bg-destructive text-white border-0">
                  {unread.length}
                </Badge>
              )}
            </TabsTrigger>
            {Object.entries(typeConfig).map(([type, cfg]) => (
              <TabsTrigger key={type} value={type} className="text-xs gap-1">
                <cfg.icon size={11} className={cfg.color} />
                {cfg.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Content for each tab */}
          {["all", "unread", ...Object.keys(typeConfig)].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-2">
              {getFiltered(tab).length === 0 ? (
                <div className="text-center py-16">
                  <Bell size={32} className="text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">No notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
                </div>
              ) : (
                getFiltered(tab).map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    onMarkRead={markRead}
                    onDelete={deleteNotif}
                  />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
