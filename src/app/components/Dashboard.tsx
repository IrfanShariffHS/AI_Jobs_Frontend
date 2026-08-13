import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Briefcase, Send, Clock, XCircle, Calendar, Gift,
  TrendingUp, Brain, Zap, Bell, ArrowUpRight, ChevronRight,
  FileText, CircleCheck, AlertCircle, RefreshCw,
  Flame, Star,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import type { NavSection } from "./Sidebar";
import { cn } from "./ui/utils";
import { useIsMobile } from "./ui/use-mobile";
import { dashboardService } from "../../services/dashboardService";
import { apiService } from "../../services/api";
import { PlatformConnectionsPanel } from "./PlatformConnectionsPanel";

import { AiKeyStatusBanner } from "./AiKeyStatusBanner";

interface DashboardProps {
  onNavigate: (section: NavSection, settingsSection?: string) => void;
}


// Plain SVG dual-sparkline — avoids Recharts multi-series key collision bug
function ActivitySparklines({ data }: { data: { day: string; applied: number; interviews: number }[] }) {
  if (!data || data.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
        Not enough activity data yet
      </div>
    );
  }
  const W = 560, H = 160, pad = { t: 8, r: 4, b: 32, l: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const maxVal = Math.max(...data.map(d => d.applied), 1); // Ensure at least 1 to avoid division by zero
  const xs = data.map((_, i) => pad.l + (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / maxVal) * innerH;
  const toPath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"}${xs[i].toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* Grid lines */}
      {[0, 0.5, 1].map((t, i) => (
        <line
          key={`grid-${i}`}
          x1={pad.l} x2={W - pad.r}
          y1={pad.t + innerH * (1 - t)} y2={pad.t + innerH * (1 - t)}
          stroke="var(--color-border)" strokeWidth={1}
        />
      ))}
      {/* Applied line */}
      <path d={toPath(data.map(d => d.applied))} fill="none" stroke="var(--color-chart-1)" strokeWidth={2} strokeLinejoin="round" />
      {/* Interviews line */}
      <path d={toPath(data.map(d => d.interviews))} fill="none" stroke="var(--color-chart-3)" strokeWidth={2} strokeLinejoin="round" />
      {/* X axis labels */}
      {data.map((d, i) => (
        <text key={`x-${i}`} x={xs[i]} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--color-muted-foreground)">
          {d.day}
        </text>
      ))}
      {/* Y axis labels */}
      {[0, Math.round(maxVal / 2), maxVal].map((v, i) => (
        <text key={`y-${i}`} x={pad.l - 4} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--color-muted-foreground)">
          {v}
        </text>
      ))}
    </svg>
  );
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
          <circle
            cx="50" cy="50" r={r} fill="none" strokeWidth="8"
            stroke={color} strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-foreground">{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [trendingSkills, setTrendingSkills] = useState<any[]>([]);
  const [trendingSkillsLoading, setTrendingSkillsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("User");
  const [profileScores, setProfileScores] = useState({ resumeScore: 0, atsScore: 0, profileScore: 0 });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiRecommendationsLoading, setAiRecommendationsLoading] = useState(true);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  useEffect(() => {
    const emptyWeekly = [
      { day: "Mon", applied: 0, interviews: 0 },
      { day: "Tue", applied: 0, interviews: 0 },
      { day: "Wed", applied: 0, interviews: 0 },
      { day: "Thu", applied: 0, interviews: 0 },
      { day: "Fri", applied: 0, interviews: 0 },
      { day: "Sat", applied: 0, interviews: 0 },
      { day: "Sun", applied: 0, interviews: 0 },
    ];

    const defaultStats = {
      jobCrawlingMetrics: { totalCrawled: 0, platformBreakdown: {}, averageResumeMatchScore: "0%" },
      applicationOutcomes: { applied: 0, skipped: 0, failed: 0 },
      recruiterStats: { total: 0, replied: 0, pending: 0, offers: 0 },
      emailStats: { totalSent: 0, totalFailed: 0, sentToday: 0, sentThisWeek: 0, sentThisMonth: 0 },
      resumeStats: { totalUploads: 0, successfulSyncs: 0, lastUpload: null },
    };

    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Critical path only — show the dashboard as soon as stats arrive.
        // Trending skills scrapes Naukri and can take 1–2 minutes; never block UI on it.
        const statsResponse = await dashboardService.getStats();
        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        } else {
          console.error("Stats error:", statsResponse.error);
          setStats(defaultStats);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setStats(defaultStats);
        setError("Failed to load some dashboard data");
      } finally {
        setLoading(false);
      }

      // Background enrichment (non-blocking)
      void (async () => {
        try {
          const profileResponse = await apiService.get<any>("/api/profile");
          if (profileResponse.success && profileResponse.data) {
            const payload = profileResponse.data;
            const userData = payload.user || payload;
            setUserName(userData.name || userData.fullName || userData.firstName || "User");
            setProfileScores({
              resumeScore: userData.resumeScore || 0,
              atsScore: userData.atsScore || 0,
              profileScore: userData.profileScore || userData.profileCompletion || 0,
            });
          }
        } catch (profileError) {
          console.error("Profile error (non-critical):", profileError);
        }

        try {
          const weeklyResponse = await apiService.get<any>("/api/dashboard/weekly-stats");
          if (weeklyResponse.success && weeklyResponse.data) {
            const payload = weeklyResponse.data;
            const list = Array.isArray(payload)
              ? payload
              : Array.isArray(payload?.data)
                ? payload.data
                : emptyWeekly;
            setWeeklyData(list);
          } else {
            setWeeklyData(emptyWeekly);
          }
        } catch (weeklyError) {
          console.error("Weekly stats error (non-critical):", weeklyError);
          setWeeklyData(emptyWeekly);
        }

        try {
          setTrendingSkillsLoading(true);
          const skillsResponse = await dashboardService.getTrendingSkills();
          if (skillsResponse.success && Array.isArray(skillsResponse.data)) {
            setTrendingSkills(skillsResponse.data);
          } else {
            setTrendingSkills([]);
          }
        } catch (skillsError) {
          console.error("Skills error (non-critical):", skillsError);
          setTrendingSkills([]);
        } finally {
          setTrendingSkillsLoading(false);
        }

        try {
          setAiRecommendationsLoading(true);
          const recResponse = await dashboardService.getAiRecommendations();
          if (recResponse.success && Array.isArray(recResponse.data)) {
            setAiRecommendations(recResponse.data);
          } else {
            setAiRecommendations([]);
          }
        } catch (recError) {
          console.error("AI recommendations error (non-critical):", recError);
          setAiRecommendations([]);
        } finally {
          setAiRecommendationsLoading(false);
        }
      })();
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="animate-spin text-primary mx-auto mb-3" size={32} />
          <p className="text-sm text-foreground">Loading dashboard...</p>
          <p className="text-xs text-muted-foreground mt-1">Fetching your stats</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-destructive mx-auto mb-3" size={32} />
          <p className="text-sm text-muted-foreground">{error || 'No data available'}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Transform API data to match component structure
  const kpiCards = [
    { label: "Total Applied", value: stats.applicationOutcomes?.applied || 0, icon: Send, color: "text-chart-1", bg: "bg-[oklch(0.62_0.24_264_/_0.12)]", change: `+${stats.emailStats?.sentToday || 0} today` },
    { label: "Pending Review", value: stats.applicationOutcomes?.skipped || 0, icon: Clock, color: "text-chart-4", bg: "bg-[oklch(0.75_0.2_60_/_0.12)]", change: "Awaiting response" },
    { label: "Interviews", value: stats.recruiterStats?.replied || 0, icon: Calendar, color: "text-chart-3", bg: "bg-[oklch(0.72_0.18_152_/_0.12)]", change: "Scheduled" },
    { label: "Recruiters", value: stats.recruiterStats?.total || 0, icon: Gift, color: "text-chart-2", bg: "bg-[oklch(0.70_0.19_216_/_0.12)]", change: `${stats.recruiterStats?.pending || 0} pending` },
    { label: "Failed", value: stats.applicationOutcomes?.failed || 0, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", change: "Need attention" },
    { label: "Match Score", value: stats.jobCrawlingMetrics?.averageResumeMatchScore || "0%", icon: TrendingUp, color: "text-chart-3", bg: "bg-[oklch(0.72_0.18_152_/_0.12)]", change: "Average score" },
  ];

  const analyticsWeekly = weeklyData.length > 0 ? weeklyData : [
    { day: "Mon", applied: stats.emailStats?.sentToday || 0, interviews: stats.recruiterStats?.replied || 0 },
    { day: "Tue", applied: stats.emailStats?.sentToday || 0, interviews: stats.recruiterStats?.replied || 0 },
    { day: "Wed", applied: stats.emailStats?.sentToday || 0, interviews: stats.recruiterStats?.replied || 0 },
    { day: "Thu", applied: stats.emailStats?.sentToday || 0, interviews: stats.recruiterStats?.replied || 0 },
    { day: "Fri", applied: stats.emailStats?.sentToday || 0, interviews: stats.recruiterStats?.replied || 0 },
    { day: "Sat", applied: 0, interviews: 0 },
    { day: "Sun", applied: 0, interviews: 0 },
  ];

  const appliedCount = stats.applicationOutcomes?.applied || 0;
  const viewedMultiplier = stats.jobCrawlingMetrics?.viewedMultiplier || 0.65;
  const funnelMax = stats.jobCrawlingMetrics?.funnelMax || Math.max(appliedCount, 1);
  
  const funnelData = [
    { name: "Applied", value: appliedCount, fill: "var(--color-chart-1)" },
    { name: "Viewed", value: Math.floor(appliedCount * viewedMultiplier), fill: "var(--color-chart-2)" },
    { name: "Screening", value: stats.applicationOutcomes?.skipped || 0, fill: "var(--color-chart-4)" },
    { name: "Interview", value: stats.recruiterStats?.replied || 0, fill: "var(--color-chart-3)" },
    { name: "Offer", value: stats.recruiterStats?.offers || 0, fill: "var(--color-chart-5)" },
  ];

  // Dynamic data derived from API
  const activityFeed = [
    { icon: CircleCheck, color: "text-chart-3", message: `Applied to ${stats.applicationOutcomes?.applied || 0} jobs`, time: "Today" },
    { icon: Calendar, color: "text-chart-2", message: `${stats.recruiterStats?.replied || 0} recruiter${stats.recruiterStats?.replied !== 1 ? 's' : ''} replied`, time: "Today" },
    { icon: AlertCircle, color: "text-chart-4", message: `${stats.applicationOutcomes?.skipped || 0} jobs pending review`, time: "Today" },
    { icon: Brain, color: "text-chart-1", message: `Found ${stats.jobCrawlingMetrics?.totalCrawled || 0} matched jobs`, time: "Today" },
    { icon: RefreshCw, color: "text-muted-foreground", message: `Resume synced ${stats.resumeStats?.successfulSyncs || 0} times`, time: "Recent" },
  ];

  const visibleRecommendations = showAllRecommendations
    ? aiRecommendations
    : aiRecommendations.slice(0, isMobile ? 3 : 4);

  const navigateFromRecommendation = (rec: any) => {
    const action = String(rec?.action || rec?.category || "").toLowerCase();
    if (action.includes("job")) onNavigate("jobs");
    else if (action.includes("recruiter")) onNavigate("recruiters");
    else if (action.includes("application")) onNavigate("applications");
    else if (action.includes("automat")) onNavigate("automation");
    else onNavigate("profile");
  };

  return (
    <div className="h-full overflow-y-auto">
      <AiKeyStatusBanner onNavigateToSettings={(section) => onNavigate("settings", section)} />
      <div className={cn("space-y-6 max-w-[1400px] mx-auto", isMobile ? "p-4" : "p-6")}>

        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-[oklch(0.62_0.24_264_/_0.15)] via-[oklch(0.62_0.24_264_/_0.08)] to-transparent p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className={cn("font-semibold text-foreground", isMobile ? "text-base" : "text-lg")}>Good morning, {userName} 👋</h2>
              <p className={cn("text-muted-foreground mt-0.5", isMobile ? "text-xs" : "text-sm")}>
                Your automation applied to <span className="text-primary font-medium">{stats.applicationOutcomes?.applied || 0} jobs</span> today.
                {" "}<span className="text-chart-3 font-medium">{stats.recruiterStats?.replied || 0} recruiter{stats.recruiterStats?.replied !== 1 ? 's' : ''}</span> replied.
              </p>
            </div>
            <Button size={isMobile ? "sm" : "sm"} className="shrink-0 gap-1.5" onClick={() => onNavigate("automation")}>
              <Zap size={13} />
              {!isMobile && "View Progress"}
            </Button>
          </div>
          {/* Decorative bg */}
          {!isMobile && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-5">
              <Brain size={80} />
            </div>
          )}
        </motion.div>

        {/* KPI Cards */}
        <div className={cn("grid gap-3", isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6")}>
          {kpiCards.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <Card className="p-4 gap-2 border-border hover:border-primary/30 transition-colors cursor-pointer group">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", kpi.bg)}>
                  <kpi.icon size={15} className={kpi.color} />
                </div>
                <div>
                  <p className={cn("font-bold text-foreground leading-none", isMobile ? "text-xl" : "text-2xl")}>{kpi.value}</p>
                  <p className={cn("text-muted-foreground mt-0.5", isMobile ? "text-[10px]" : "text-[11px]")}>{kpi.label}</p>
                  {!isMobile && <p className="text-[10px] text-muted-foreground/70 mt-1">{kpi.change}</p>}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main content grid */}
        <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-3")}>

          {/* Left column: Charts */}
          <div className={cn(isMobile ? "col-span-1" : "xl:col-span-2", "space-y-6")}>

            {/* Application trend */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={cn("font-semibold", isMobile ? "text-xs" : "text-sm")}>Application Activity</CardTitle>
                    <CardDescription className={cn(isMobile ? "text-[10px]" : "text-xs")}>Past 7 days</CardDescription>
                  </div>
                  <div className={cn("flex items-center gap-4 text-muted-foreground", isMobile ? "text-[10px]" : "text-[11px]")}>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-chart-1 inline-block" />Applied</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-chart-3 inline-block" />Interviews</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <ActivitySparklines data={analyticsWeekly} />
              </CardContent>
            </Card>

            {/* Funnel + Scores row */}
            <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
              {/* Application funnel */}
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Application Funnel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 pb-4">
                  {funnelData.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="text-foreground font-medium">{item.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(item.value / funnelMax) * 100}%`, background: item.fill }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Score rings */}
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Profile Scores</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-around pb-4">
                  <ScoreRing score={profileScores.resumeScore || 0} label="Resume Score" color="var(--color-chart-1)" />
                  <ScoreRing score={profileScores.atsScore || 0} label="ATS Score" color="var(--color-chart-3)" />
                  <ScoreRing score={profileScores.profileScore || 0} label="Profile %" color="var(--color-chart-2)" />
                </CardContent>
              </Card>
            </div>

            {/* Trending Skills */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame size={15} className="text-chart-4" />
                    <CardTitle className="text-sm font-semibold">Trending Skills in Your Field</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => onNavigate("profile")}>
                    Manage Skills <ChevronRight size={12} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-3">
                  {trendingSkillsLoading ? (
                    <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                      <RefreshCw size={12} className="animate-spin" />
                      Analyzing skills for your field...
                    </div>
                  ) : (Array.isArray(trendingSkills) ? trendingSkills : []).length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3">
                      No trending skills yet. Upload your resume and complete your profile — market keywords refresh in the background.
                    </p>
                  ) : (
                    (Array.isArray(trendingSkills) ? trendingSkills : []).map((skill) => (
                    <div key={skill.name} className="group">
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-medium text-foreground w-28 shrink-0">{skill.name}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-chart-1 transition-all duration-700"
                            style={{ width: `${skill.demand}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-chart-3 font-medium w-12 text-right">{skill.growth}</span>
                        {skill.priority && (
                          <Badge 
                            variant={skill.priority === 'high' ? 'destructive' : skill.priority === 'medium' ? 'default' : 'secondary'}
                            className={cn("text-[9px] h-4 px-1.5", 
                              skill.priority === 'high' && "bg-destructive/10 text-destructive",
                              skill.priority === 'medium' && "bg-chart-4/10 text-chart-4"
                            )}
                          >
                            {skill.priority}
                          </Badge>
                        )}
                      </div>
                      {skill.explanation && (
                        <p className="text-[10px] text-muted-foreground mt-1.5 ml-31 opacity-0 group-hover:opacity-100 transition-opacity">
                          {skill.explanation}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 ml-31 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
                        {skill.impact && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground capitalize">
                            <Star size={8} className={skill.impact === 'high' ? 'text-chart-3' : skill.impact === 'medium' ? 'text-chart-4' : 'text-muted-foreground'} />
                            Impact: {skill.impact}
                          </span>
                        )}
                        {typeof skill.recommendation_score === 'number' && (
                          <span className="text-[9px] text-muted-foreground">Score: {skill.recommendation_score}</span>
                        )}
                        {typeof skill.frequency === 'number' && skill.frequency > 0 && (
                          <span className="text-[9px] text-muted-foreground">Freq: {skill.frequency}</span>
                        )}
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* AI Recommendations */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Brain size={15} className="text-primary" />
                    <CardTitle className={cn("font-semibold", isMobile ? "text-xs" : "text-sm")}>AI Recommendations</CardTitle>
                  </div>
                  {!aiRecommendationsLoading && aiRecommendations.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {aiRecommendations.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                {aiRecommendationsLoading ? (
                  <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                    <RefreshCw size={12} className="animate-spin" />
                    Loading recommendations...
                  </div>
                ) : visibleRecommendations.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3">
                    No recommendations yet. Upload a resume and connect portals to get personalized AI guidance.
                  </p>
                ) : (
                  visibleRecommendations.map((rec, i) => (
                    <div
                      key={rec.id || i}
                      onClick={() => navigateFromRecommendation(rec)}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                        rec.priority === "high" ? "bg-destructive" : rec.priority === "low" ? "bg-muted-foreground" : "bg-chart-4"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-foreground", isMobile ? "text-[11px]" : "text-[12px]")}>{rec.title}</p>
                        <p className={cn("text-chart-3 mt-0.5", isMobile ? "text-[10px]" : "text-[11px]")}>{rec.impact}</p>
                        {rec.explanation && (
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{String(rec.explanation)}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {rec.category && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 capitalize">{String(rec.category)}</Badge>
                          )}
                          {typeof rec.recommendation_score === "number" && (
                            <span className="text-[9px] text-muted-foreground">Score: {String(rec.recommendation_score)}</span>
                          )}
                          {typeof rec.matchScore === "number" && (
                            <span className="text-[9px] text-muted-foreground">Match: {String(rec.matchScore)}%</span>
                          )}
                          {typeof rec.demand === "number" && (
                            <span className="text-[9px] text-muted-foreground">Demand: {String(rec.demand)}%</span>
                          )}
                          {rec.growth != null && (
                            <span className="text-[9px] text-chart-3">{String(rec.growth)}</span>
                          )}
                        </div>
                      </div>
                      {!isMobile && <ArrowUpRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />}
                    </div>
                  ))
                )}
                {!aiRecommendationsLoading && aiRecommendations.length > (isMobile ? 3 : 4) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("w-full mt-1", isMobile ? "text-[10px] h-6" : "text-xs h-7")}
                    onClick={() => setShowAllRecommendations((v) => !v)}
                  >
                    {showAllRecommendations
                      ? "Show fewer"
                      : `View all ${aiRecommendations.length} recommendations`}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className={cn("font-semibold", isMobile ? "text-xs" : "text-sm")}>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className={cn("grid gap-2 pb-4", isMobile ? "grid-cols-4" : "grid-cols-2")}>
                {[
                  { label: "Apply Now", icon: Send, color: "bg-primary/15 text-primary", nav: "automation" as NavSection },
                  { label: "Find Jobs", icon: Briefcase, color: "bg-chart-2/15 text-chart-2", nav: "jobs" as NavSection },
                  { label: "Update Resume", icon: FileText, color: "bg-chart-4/15 text-chart-4", nav: "profile" as NavSection },
                  { label: "Email Recruiters", icon: Bell, color: "bg-chart-5/15 text-chart-5", nav: "recruiters" as NavSection },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => onNavigate(action.nav)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors cursor-pointer",
                      isMobile ? "p-2" : "p-3"
                    )}
                  >
                    <div className={cn("rounded-lg flex items-center justify-center", action.color, isMobile ? "w-6 h-6" : "w-8 h-8")}>
                      <action.icon size={isMobile ? 12 : 15} />
                    </div>
                    <span className={cn("font-medium text-foreground", isMobile ? "text-[9px]" : "text-[11px]")}>{isMobile ? action.label.split(' ')[0] : action.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className={cn("font-semibold", isMobile ? "text-xs" : "text-sm")}>Recent Activity</CardTitle>
                  <Button variant="ghost" size="sm" className={cn(isMobile ? "text-[10px] h-6" : "text-xs h-7")} onClick={() => onNavigate("notifications")}>
                    View all
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-0 pb-4">
                {activityFeed.slice(0, isMobile ? 4 : 6).map((item, i) => (
                  <React.Fragment key={i}>
                    <div className="flex items-start gap-3 py-2.5">
                      <div className={cn("rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5", isMobile ? "w-6 h-6" : "w-7 h-7")}>
                        <item.icon size={isMobile ? 11 : 13} className={item.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-foreground leading-snug", isMobile ? "text-[11px]" : "text-[12px]")}>{item.message}</p>
                        <p className={cn("text-muted-foreground mt-0.5", isMobile ? "text-[9px]" : "text-[10px]")}>{item.time}</p>
                      </div>
                    </div>
                    {i < (isMobile ? 3 : 5) && <Separator className="bg-border/50" />}
                  </React.Fragment>
                ))}
              </CardContent>
            </Card>

            {/* Platform connections */}
            <PlatformConnectionsPanel compact onNavigateSettings={() => onNavigate("settings")} />
          </div>
        </div>
      </div>
    </div>
  );
}
