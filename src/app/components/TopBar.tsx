import React, { useState } from "react";
import { Link } from "react-router";
import { Bell, Search, Zap, ChevronDown, RefreshCw, Settings, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "./ui/dropdown-menu";
import { NavSection } from "./Sidebar";

interface TopBarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  notificationCount?: number;
  onLogout?: () => void;
}

const sectionTitles: Record<NavSection, { title: string; subtitle: string; path: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Overview of your job search activity", path: "/" },
  jobs: { title: "Job Search", subtitle: "Find and match AI-curated opportunities", path: "/jobs" },
  applications: { title: "Applications", subtitle: "Track your application pipeline", path: "/applications" },
  automation: { title: "AI Automation", subtitle: "Automated job application engine", path: "/automation" },
  scheduler: { title: "Scheduler", subtitle: "Manage automated tasks and schedules", path: "/scheduler" },
  recruiters: { title: "Recruiter Hub", subtitle: "Manage recruiter outreach and emails", path: "/recruiters" },
  analytics: { title: "Analytics", subtitle: "Insights and performance metrics", path: "/analytics" },
  profile: { title: "Profile & Resume", subtitle: "Optimize your professional presence", path: "/profile" },
  notifications: { title: "Notifications", subtitle: "Alerts and updates", path: "/notifications" },
  settings: { title: "Settings", subtitle: "Configure your preferences", path: "/settings" },
  recruiter_extraction: { title: "Recruiter Extraction", subtitle: "Extract recruiter information", path: "/recruiter-extraction" },
  trending_skills: { title: "Trending Skills", subtitle: "Discover in-demand skills in your field", path: "/trending-skills" },
};

export function TopBar({ activeSection, onNavigate, notificationCount = 3, onLogout }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { title, subtitle } = sectionTitles[activeSection];

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card/50 shrink-0 backdrop-blur-sm">
      {/* Left: Page title */}
      <div className="flex flex-col justify-center">
        <h1 className="text-base font-semibold text-foreground leading-tight">{title}</h1>
        <p className="text-[11px] text-muted-foreground leading-tight">{subtitle}</p>
      </div>

      {/* Center: Quick search */}
      <div className="hidden md:flex flex-1 max-w-sm mx-6 relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search jobs, companies, skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-8 text-sm bg-muted/50 border-border focus-visible:ring-1"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Automation quick status */}
        <Link to="/automation">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center gap-1.5 h-8 text-xs border-border"
            onClick={() => onNavigate("automation")}
          >
            <Zap size={12} className="text-primary" />
            <span className="text-muted-foreground">Running</span>
            <span className="text-primary font-mono">23/50</span>
          </Button>
        </Link>

        {/* Sync button */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <RefreshCw size={14} className="text-muted-foreground" />
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Link to="/notifications">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onNavigate("notifications")}
            >
              <Bell size={15} className="text-muted-foreground" />
            </Button>
          </Link>
          {notificationCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-destructive text-[9px] flex items-center justify-center text-white font-bold">
              {notificationCount}
            </span>
          )}
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[11px] font-semibold text-primary-foreground">AR</span>
              </div>
              <ChevronDown size={12} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium text-foreground">Alex Rivera</p>
                <p className="text-[11px] text-muted-foreground font-normal">alex.rivera@email.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <User size={14} className="mr-2" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings size={14} className="mr-2" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={onLogout}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
