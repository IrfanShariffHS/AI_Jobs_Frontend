import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import {
  LayoutDashboard, Search, KanbanSquare, Zap, Clock, Users,
  BarChart3, User, Bell, Settings, ChevronLeft, ChevronRight,
  Brain, Briefcase, TrendingUp, LogOut, CircleDot, MailSearch, X, Menu,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";
import { useIsMobile } from "./ui/use-mobile";
import { applicationService } from "../../services/applicationService";
import { notificationService } from "../../services/notificationService";
import { dashboardService } from "../../services/dashboardService";
import { apiService } from "../../services/api";

export type NavSection =
  | "dashboard" | "jobs" | "applications" | "automation"
  | "scheduler" | "recruiters" | "analytics" | "profile"
  | "notifications" | "settings" | "recruiter_extraction" | "trending_skills";

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  badgeVariant?: "default" | "destructive" | "outline" | "secondary";
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "jobs", label: "Job Search", icon: <Search size={18} /> },
  { id: "applications", label: "Applications", icon: <KanbanSquare size={18} /> },
  { id: "automation", label: "AI Automation", icon: <Zap size={18} /> },
  { id: "scheduler", label: "Scheduler", icon: <Clock size={18} /> },
  { id: "recruiters", label: "Recruiters", icon: <Users size={18} /> },
  { id: "recruiter_extraction", label: "Recruiter Extraction", icon: <MailSearch size={18} /> },
  { id: "trending_skills", label: "Trending Skills", icon: <TrendingUp size={18} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={18} /> },
];

const bottomNavItems: NavItem[] = [
  { id: "profile", label: "Profile & Resume", icon: <User size={18} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
  { id: "settings", label: "Settings", icon: <Settings size={18} /> },
];

interface SidebarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection, settingsSection?: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ activeSection, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState({
    applications: 0,
    automation: 0,
    notifications: 0,
  });
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "",
    initials: "",
  });

  // Fetch badge counts dynamically
  useEffect(() => {
    async function fetchBadgeCounts() {
      try {
        // Fetch applications count
        const appsResponse = await applicationService.getApplications();
        if (appsResponse.success) {
          setBadgeCounts(prev => ({
            ...prev,
            applications: appsResponse.data?.count || 0,
          }));
        }

        // Fetch notifications count
        const notifResponse = await notificationService.getUnreadNotifications();
        if (notifResponse.success) {
          setBadgeCounts(prev => ({
            ...prev,
            notifications: notifResponse.data?.count || 0,
          }));
        }

        // Fetch automation stats for automation badge
        const statsResponse = await dashboardService.getStats();
        if (statsResponse.success && statsResponse.data) {
          const activeAutomations = (statsResponse.data as any).applicationOutcomes?.applied || 0;
          setBadgeCounts(prev => ({
            ...prev,
            automation: activeAutomations > 0 ? 1 : 0,
          }));
        }
      } catch (error) {
        console.error('Error fetching badge counts:', error);
      }
    }

    fetchBadgeCounts();
  }, []);

  // Fetch user profile data dynamically
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await apiService.get("/api/profile");
        if (response.success && response.data) {
          const data = response.data as any;
          const name = data.name || data.fullName || "User";
          const email = data.email || "";
          const initials = name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          setUserProfile({
            name,
            email,
            initials: initials || "U",
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile({
          name: "User",
          email: "",
          initials: "U",
        });
      }
    }

    fetchUserProfile();
  }, []);

  // Close mobile sidebar when clicking outside or on a nav item
  useEffect(() => {
    if (isMobile && mobileOpen) {
      const handleOutsideClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-sidebar]')) {
          setMobileOpen(false);
        }
      };
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [isMobile, mobileOpen]);

  // Mobile bottom navigation
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.slice(0, 4).map((item) => {
            const getPathForSection = (section: NavSection): string => {
              const pathMap: Record<NavSection, string> = {
                dashboard: "/",
                jobs: "/jobs",
                applications: "/applications",
                automation: "/automation",
                scheduler: "/scheduler",
                recruiters: "/recruiters",
                analytics: "/analytics",
                profile: "/profile",
                notifications: "/notifications",
                settings: "/settings",
                recruiter_extraction: "/recruiter-extraction",
                trending_skills: "/trending-skills",
              };
              return pathMap[section];
            };

            return (
              <Link
                key={item.id}
                to={getPathForSection(item.id)}
                onClick={() => {
                  onNavigate(item.id);
                }}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                  activeSection === item.id
                    ? "text-primary"
                    : "text-sidebar-foreground"
                )}
              >
                <div className={cn("relative", activeSection === item.id ? "text-primary" : "text-muted-foreground")}>
                  {item.icon}
                  {item.id === "applications" && badgeCounts.applications > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[9px] flex items-center justify-center text-white font-bold">
                      {badgeCounts.applications}
                    </span>
                  )}
                  {item.id === "automation" && badgeCounts.automation > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] flex items-center justify-center text-white font-bold">
                      {badgeCounts.automation}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-sidebar-foreground"
          >
            <Menu size={20} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>

        {/* Mobile full-screen overlay for all nav items */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setMobileOpen(false)}
            >
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-72 bg-sidebar border-l border-sidebar-border overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                data-sidebar
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                        <Brain size={16} className="text-primary-foreground" />
                      </div>
                      <span className="text-sidebar-foreground font-semibold">
                        JobPilot <span className="text-primary">AI</span>
                      </span>
                    </div>
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="p-2 rounded-lg hover:bg-sidebar-accent"
                    >
                      <X size={20} className="text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="px-2 py-1.5 mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Main
                      </span>
                    </div>
                    {navItems.map((item) => {
                      const getPathForSection = (section: NavSection): string => {
                        const pathMap: Record<NavSection, string> = {
                          dashboard: "/",
                          jobs: "/jobs",
                          applications: "/applications",
                          automation: "/automation",
                          scheduler: "/scheduler",
                          recruiters: "/recruiters",
                          analytics: "/analytics",
                          profile: "/profile",
                          notifications: "/notifications",
                          settings: "/settings",
                          recruiter_extraction: "/recruiter-extraction",
                          trending_skills: "/trending-skills",
                        };
                        return pathMap[section];
                      };

                      return (
                        <Link
                          key={item.id}
                          to={getPathForSection(item.id)}
                          onClick={() => {
                            onNavigate(item.id);
                            setMobileOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                            activeSection === item.id
                              ? "bg-primary text-primary-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          <span className={cn("shrink-0", activeSection === item.id ? "text-primary-foreground" : "text-muted-foreground")}>
                            {item.icon}
                          </span>
                          <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                          {item.id === "applications" && badgeCounts.applications > 0 && (
                            <Badge variant="default" className="h-5 px-1.5 text-xs">
                              {badgeCounts.applications}
                            </Badge>
                          )}
                          {item.id === "automation" && badgeCounts.automation > 0 && (
                            <Badge variant="default" className="h-5 px-1.5 text-xs">
                              {badgeCounts.automation}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}

                    <div className="px-2 py-1.5 mb-2 mt-6">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Account
                      </span>
                    </div>
                    {bottomNavItems.map((item) => {
                      const getPathForSection = (section: NavSection): string => {
                        const pathMap: Record<NavSection, string> = {
                          dashboard: "/",
                          jobs: "/jobs",
                          applications: "/applications",
                          automation: "/automation",
                          scheduler: "/scheduler",
                          recruiters: "/recruiters",
                          analytics: "/analytics",
                          profile: "/profile",
                          notifications: "/notifications",
                          settings: "/settings",
                          recruiter_extraction: "/recruiter-extraction",
                          trending_skills: "/trending-skills",
                        };
                        return pathMap[section];
                      };

                      return (
                        <Link
                          key={item.id}
                          to={getPathForSection(item.id)}
                          onClick={() => {
                            onNavigate(item.id);
                            setMobileOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                            activeSection === item.id
                              ? "bg-primary text-primary-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          <span className={cn("shrink-0", activeSection === item.id ? "text-primary-foreground" : "text-muted-foreground")}>
                            {item.icon}
                          </span>
                          <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                          {item.id === "notifications" && badgeCounts.notifications > 0 && (
                            <Badge variant="default" className="h-5 px-1.5 text-xs">
                              {badgeCounts.notifications}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop sidebar
  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={false}
        animate={{ width: collapsed ? 60 : 220 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative flex flex-col h-full bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-3 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shrink-0">
              <Brain size={16} className="text-primary-foreground" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <span className="text-sidebar-foreground font-semibold whitespace-nowrap" style={{ letterSpacing: "-0.02em" }}>
                    JobPilot <span className="text-primary">AI</span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Automation status pill */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-3 mt-3 overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-[oklch(0.62_0.24_264_/_0.15)] border border-[oklch(0.62_0.24_264_/_0.25)]">
                <CircleDot size={10} className="text-primary animate-pulse shrink-0" />
                <span className="text-[11px] text-primary font-medium whitespace-nowrap">Automation Running</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {!collapsed && (
            <div className="px-2 py-1.5 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Main
              </span>
            </div>
          )}
          {navItems.map((item) => (
            <NavItemComponent
              key={item.id}
              item={item}
              active={activeSection === item.id}
              collapsed={collapsed}
              onNavigate={onNavigate}
              badgeCounts={badgeCounts}
            />
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="px-2 pb-3 space-y-0.5 border-t border-sidebar-border pt-3">
          {!collapsed && (
            <div className="px-2 py-1.5 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Account
              </span>
            </div>
          )}
          {bottomNavItems.map((item) => (
            <NavItemComponent
              key={item.id}
              item={item}
              active={activeSection === item.id}
              collapsed={collapsed}
              onNavigate={onNavigate}
              badgeCounts={badgeCounts}
            />
          ))}

          {/* Divider */}
          <div className="my-2 border-t border-sidebar-border" />

          {/* User profile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/profile"
                onClick={() => onNavigate("profile")}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group"
              >
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-semibold text-primary-foreground">{userProfile.initials}</span>
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0 text-left overflow-hidden">
                    <p className="text-[12px] font-medium text-sidebar-foreground truncate">{userProfile.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{userProfile.email}</p>
                  </div>
                )}
              </Link>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{userProfile.name}</TooltipContent>}
          </Tooltip>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="absolute top-4 -right-3 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center hover:bg-sidebar-accent transition-colors z-10 shadow-sm"
        >
          {collapsed
            ? <ChevronRight size={12} className="text-muted-foreground" />
            : <ChevronLeft size={12} className="text-muted-foreground" />}
        </button>
      </motion.div>
    </TooltipProvider>
  );
}

function NavItemComponent({
  item,
  active,
  collapsed,
  onNavigate,
  badgeCounts,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate: (section: NavSection, settingsSection?: string) => void;
  badgeCounts: { applications: number; automation: number; notifications: number };
}) {
  const getBadgeCount = () => {
    if (item.id === "applications") return badgeCounts.applications;
    if (item.id === "automation") return badgeCounts.automation;
    if (item.id === "notifications") return badgeCounts.notifications;
    return 0;
  };

  const badgeCount = getBadgeCount();

  const getPathForSection = (section: NavSection): string => {
    const pathMap: Record<NavSection, string> = {
      dashboard: "/",
      jobs: "/jobs",
      applications: "/applications",
      automation: "/automation",
      scheduler: "/scheduler",
      recruiters: "/recruiters",
      analytics: "/analytics",
      profile: "/profile",
      notifications: "/notifications",
      settings: "/settings",
      recruiter_extraction: "/recruiter-extraction",
      trending_skills: "/trending-skills",
    };
    return pathMap[section];
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={getPathForSection(item.id)}
          onClick={() => onNavigate(item.id)}
          className={cn(
            "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all duration-150 group",
            active
              ? "bg-primary text-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <span className={cn("shrink-0", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")}>
            {item.icon}
          </span>
          {!collapsed && (
            <span className="flex-1 text-left text-[13px] font-medium whitespace-nowrap overflow-hidden truncate">
              {item.label}
            </span>
          )}
          {!collapsed && badgeCount > 0 && (
            <Badge
              className={cn(
                "h-4 min-w-4 text-[10px] px-1 rounded-full shrink-0",
                active
                  ? "bg-primary-foreground/20 text-primary-foreground border-0"
                  : "bg-primary/20 text-primary border-0"
              )}
            >
              {badgeCount}
            </Badge>
          )}
        </Link>
      </TooltipTrigger>
      {collapsed && (
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.label}
          {badgeCount > 0 && (
            <Badge className="h-4 min-w-4 text-[10px] px-1 bg-primary text-primary-foreground border-0">
              {badgeCount}
            </Badge>
          )}
        </TooltipContent>
      )}
    </Tooltip>
  );
}
