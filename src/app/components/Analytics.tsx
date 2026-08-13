import React, { useState, useEffect } from "react";
import {
  XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import { Brain, Download, TrendingUp, TrendingDown, Target, Users, Mail, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "./ui/utils";
import { dashboardService } from "../../services/dashboardService";
import { apiService } from "../../services/api";

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "11px",
    color: "var(--color-foreground)",
  },
};

// Plain SVG dual-sparkline — avoids Recharts multi-series key collision bug
function DualSparkline({ data, keyX, keyA, keyB, colorA, colorB, height = 200 }: {
  data: Record<string, unknown>[];
  keyX: string; keyA: string; keyB: string;
  colorA: string; colorB: string; height?: number;
}) {
  const W = 520, H = height, pad = { t: 8, r: 4, b: 32, l: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const vals = (k: string) => data.map(d => Number(d[k]) || 0);
  const maxVal = Math.max(...vals(keyA), ...vals(keyB));
  const xs = data.map((_, i) => pad.l + (i / Math.max(data.length - 1, 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / (maxVal || 1)) * innerH;
  const path = (k: string) =>
    vals(k).map((v, i) => `${i === 0 ? "M" : "L"}${xs[i].toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {[0, 0.5, 1].map(t => (
        <line key={t} x1={pad.l} x2={W - pad.r}
          y1={pad.t + innerH * (1 - t)} y2={pad.t + innerH * (1 - t)}
          stroke="var(--color-border)" strokeWidth={1} />
      ))}
      <path d={path(keyA)} fill="none" stroke={colorA} strokeWidth={2} strokeLinejoin="round" />
      <path d={path(keyB)} fill="none" stroke={colorB} strokeWidth={2} strokeLinejoin="round" />
      {data.map((d, i) => (
        <text key={i} x={xs[i]} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--color-muted-foreground)">
          {String(d[keyX])}
        </text>
      ))}
      {[0, Math.round(maxVal / 2), maxVal].map((v, i) => (
        <text key={i} x={pad.l - 4} y={y(v) + 4} textAnchor="end" fontSize={10} fill="var(--color-muted-foreground)">
          {v}
        </text>
      ))}
    </svg>
  );
}

function MetricCard({ label, value, change, positive, subtitle }: {
  label: string; value: string; change: string; positive: boolean; subtitle?: string;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        <div className="flex items-center gap-1.5 mt-1">
          {positive
            ? <TrendingUp size={11} className="text-chart-3" />
            : <TrendingDown size={11} className="text-destructive" />}
          <span className={cn("text-[11px] font-medium", positive ? "text-chart-3" : "text-destructive")}>{change}</span>
          {subtitle && <span className="text-[11px] text-muted-foreground">{subtitle}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function Analytics() {
  const [timeRange, setTimeRange] = useState<"weekly" | "monthly">("weekly");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<{ icon: any; color: string; bg: string; title: string; insight: string }[]>([]);
  const [recruiterResponseData, setRecruiterResponseData] = useState<{ name: string; rate: number }[]>([]);

  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        setLoading(true);
        const [statsResponse, weeklyResponse, recResponse, recruitersResponse] = await Promise.all([
          dashboardService.getStats(),
          apiService.get<any>("/api/dashboard/weekly-stats"),
          dashboardService.getAiRecommendations(),
          apiService.get<any>("/api/recruiters"),
        ]);

        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        } else {
          setError(statsResponse.error || "Failed to load analytics data");
        }

        if (weeklyResponse.success && weeklyResponse.data) {
          const payload = weeklyResponse.data;
          const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
          setWeeklyData(list);
        }

        if (recResponse.success && Array.isArray(recResponse.data)) {
          const colors = [
            { icon: TrendingUp, color: "text-chart-3", bg: "bg-chart-3/15" },
            { icon: Target, color: "text-chart-1", bg: "bg-chart-1/15" },
            { icon: Users, color: "text-chart-2", bg: "bg-chart-2/15" },
            { icon: Mail, color: "text-chart-4", bg: "bg-chart-4/15" },
            { icon: Brain, color: "text-primary", bg: "bg-primary/15" },
          ];
          setAiInsights(recResponse.data.slice(0, 8).map((rec, i) => ({
            ...colors[i % colors.length],
            title: rec.title,
            insight: String(rec.explanation || rec.impact || ""),
          })));
        }

        if (recruitersResponse.success && recruitersResponse.data) {
          const payload = recruitersResponse.data as any;
          const list = Array.isArray(payload) ? payload : Array.isArray(payload?.recruiters) ? payload.recruiters : Array.isArray(payload?.data) ? payload.data : [];
          const byCompany: Record<string, { total: number; replied: number }> = {};
          list.forEach((r: any) => {
            const company = r.company || r.companyName || "Unknown";
            if (!byCompany[company]) byCompany[company] = { total: 0, replied: 0 };
            byCompany[company].total += 1;
            if (r.alreadyReplied || r.replied) byCompany[company].replied += 1;
          });
          setRecruiterResponseData(
            Object.entries(byCompany)
              .map(([name, v]) => ({ name, rate: v.total ? Math.round((v.replied / v.total) * 100) : 0 }))
              .sort((a, b) => b.rate - a.rate)
              .slice(0, 8)
          );
        }
      } catch (err) {
        setError("Network error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalyticsData();
  }, []);

  const data = weeklyData.length > 0 ? weeklyData : [
    { day: "Mon", applied: stats?.applicationOutcomes?.applied || stats?.emailStats?.sentToday || 0, interviews: stats?.recruiterStats?.replied || 0 },
    { day: "Tue", applied: 0, interviews: 0 },
    { day: "Wed", applied: 0, interviews: 0 },
    { day: "Thu", applied: 0, interviews: 0 },
    { day: "Fri", applied: 0, interviews: 0 },
    { day: "Sat", applied: 0, interviews: 0 },
    { day: "Sun", applied: 0, interviews: 0 },
  ];

  const responseRateData = data.map((d: any, i: number) => ({
    week: d.day || d.week || `D${i + 1}`,
    rate: d.applied ? Math.min(100, Math.round(((d.interviews || 0) / Math.max(d.applied, 1)) * 100)) : 0,
  }));

  // Calculate dynamic KPI values
  const totalApplications = stats?.applicationOutcomes?.applied || 0;
  const totalInterviews = stats?.recruiterStats?.replied || 0;
  const totalOffers = stats?.recruiterStats?.offers || 0;
  const interviewRate = totalApplications > 0 ? ((totalInterviews / totalApplications) * 100).toFixed(1) : "0.0";
  const offerRate = totalApplications > 0 ? ((totalOffers / totalApplications) * 100).toFixed(1) : "0.0";
  const responseRate = totalApplications > 0 ? ((totalInterviews / totalApplications) * 100).toFixed(0) : "0";

  const xKey = "day";

  const companyAnalytics = Object.entries(stats?.jobCrawlingMetrics?.platformBreakdown || {}).map(([name, count], i) => ({
    name,
    applications: Number(count),
    interviews: Math.floor(Number(count) * 0.15),
    fill: ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"][i % 5],
    value: Number(count),
  }));

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-muted-foreground mx-auto mb-3" size={32} />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
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
      <div className="p-6 max-w-[1200px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
              <TabsList className="bg-muted/50 h-8">
                <TabsTrigger value="weekly" className="text-xs h-6">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs h-6">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Download size={12} /> Export Report
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard label="Total Applications" value={String(totalApplications)} change="Current" positive={true} subtitle="All time" />
          <MetricCard label="Interview Rate" value={`${interviewRate}%`} change="Current" positive={true} subtitle="Based on applications" />
          <MetricCard label="Offer Rate" value={`${offerRate}%`} change="Current" positive={offerRate !== "0.0"} subtitle="Based on applications" />
          <MetricCard label="Response Rate" value={`${responseRate}%`} change="Current" positive={true} subtitle="Based on applications" />
        </div>

        {/* Main charts grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Application volume */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Application Volume</CardTitle>
              <CardDescription className="text-xs">Jobs applied vs interviews secured</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <DualSparkline
                data={data as Record<string, unknown>[]}
                keyX={xKey} keyA="applied" keyB="interviews"
                colorA="var(--color-chart-1)" colorB="var(--color-chart-3)"
                height={200}
              />
            </CardContent>
          </Card>

          {/* Response rate trend */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Response Rate Trend</CardTitle>
              <CardDescription className="text-xs">% of applications that received recruiter response</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={responseRateData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <ReTooltip {...tooltipStyle} formatter={(v) => [`${v}%`, "Response Rate"]} />
                  <Line type="monotone" dataKey="rate" stroke="var(--color-chart-2)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Company distribution */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Applications by Company</CardTitle>
              <CardDescription className="text-xs">Distribution across top companies</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={companyAnalytics}
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {companyAnalytics.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} strokeWidth={0} />
                      ))}
                    </Pie>
                    <ReTooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {companyAnalytics.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.fill }} />
                        <span className="text-[12px] text-foreground">{item.name}</span>
                      </div>
                      <span className="text-[12px] font-medium text-muted-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recruiter response rates */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Recruiter Response Rates</CardTitle>
              <CardDescription className="text-xs">By company — outreach effectiveness</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={recruiterResponseData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={50} />
                  <ReTooltip {...tooltipStyle} formatter={(v) => [`${v}%`, "Response Rate"]} />
                  <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                    {recruiterResponseData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.rate >= 80 ? "var(--color-chart-3)" : entry.rate >= 65 ? "var(--color-chart-2)" : "var(--color-chart-4)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-primary" />
              <CardTitle className="text-sm font-semibold">AI-Powered Insights</CardTitle>
            </div>
            <CardDescription className="text-xs">Personalized recommendations based on your application data</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {aiInsights.length === 0 ? (
                <p className="text-xs text-muted-foreground col-span-full py-4">No AI insights yet. Complete your profile and upload a resume to generate recommendations.</p>
              ) : aiInsights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", insight.bg)}>
                    <insight.icon size={16} className={insight.color} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">{insight.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{insight.insight}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
