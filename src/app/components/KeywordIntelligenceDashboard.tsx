import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Brain, TrendingUp, AlertCircle, CheckCircle, XCircle,
  Download, Filter, RefreshCw, BarChart3, Target,
  FileText, Linkedin, Globe, Search, Zap, Award,
  PieChart, ArrowUpRight, ArrowDownRight, Minus,
  ChevronRight, Settings, Info, Sparkles, Edit, Briefcase
} from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { cn } from "./ui/utils";
import { useIsMobile } from "./ui/use-mobile";
import { apiService } from "../../services/api";

interface KeywordIntelligenceDashboardProps {
  onNavigate?: (section: string) => void;
}

interface DashboardData {
  analysisReportId?: number;
  atsScore: number;
  recruiterVisibilityScore: number;
  profileCompletionScore: number;
  keywordCoverageScore: number;
  resumeHealthScore: number;
  naukriHealthScore: number;
  linkedinHealthScore: number;
  totalKeywordsAnalyzed: number;
  missingKeywordsCount: number;
  weakKeywordsCount: number;
  trendingSkillsCount: number;
  activeJobMatches: number;
  keywordComparisons: KeywordComparison[];
  marketTrendData: MarketTrendData;
  aiRecommendations: AIRecommendations;
  atsBreakdown: ATSBreakdown;
  filterCriteria: FilterCriteria;
  analysisDate: string;
  jobDomain: string;
  targetRole: string;
  experienceLevel: string;
  location: string;
}

interface KeywordComparison {
  keyword: string;
  marketDemandScore: number;
  demandLevel: string;
  resumePresent: boolean;
  resumeStrength: string;
  naukriPresent: boolean;
  naukriStrength: string;
  linkedinPresent: boolean;
  linkedinStrength: string;
  priority: string;
  atsImpactScore: number;
  recruiterVisibilityImpact: number;
  trendGrowthPercentage: number;
  recruiterSearchFrequency: number;
  jobPostingCount: number;
  averageSalaryRange: string;
  recommendedSections: string[];
  aiSuggestion: string;
  category: string;
}

interface MarketTrendData {
  totalJobsAnalyzed: number;
  recruitersAnalyzed: number;
  trendingTechnologiesCount: number;
  emergingSkills: number;
  decliningSkills: number;
  trendingTechnologies: TrendingTechnology[];
  topHiringCompanies: TopHiringCompany[];
  mostSearchedTechnologies: string[];
  mostRequestedCertifications: string[];
  fastestGrowingSkills: string[];
  emergingTechnologies: string[];
  topHiringLocations: string[];
}

interface TrendingTechnology {
  technology: string;
  growthPercentage: number;
  trend: string;
}

interface TopHiringCompany {
  companyName: string;
  jobPostingCount: number;
  industry: string;
}

interface AIRecommendations {
  highPriorityRecommendations: Recommendation[];
  mediumPriorityRecommendations: Recommendation[];
  lowPriorityRecommendations: Recommendation[];
  totalRecommendations: number;
}

interface Recommendation {
  keyword: string;
  status: string;
  priority: string;
  marketDemand: number;
  atsImprovement: number;
  recruiterVisibilityImprovement: number;
  recommendedSections: string[];
  aiSuggestion: string;
  category: string;
}

interface ATSBreakdown {
  skillsScore: number;
  projectsScore: number;
  experienceScore: number;
  keywordsScore: number;
  certificationsScore: number;
  sectionScores: Record<string, number>;
}

interface FilterCriteria {
  jobRole: string;
  jobDomain: string;
  experience: string;
  location: string;
  industry: string;
  employmentType: string;
  salaryRange: string;
  companyType: string;
  technologyStack: string;
  workMode: string;
}

export function KeywordIntelligenceDashboard({ onNavigate }: KeywordIntelligenceDashboardProps) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.post<DashboardData>("/api/keyword-intelligence/generate", {
        jobDomain: "",
        targetRole: "",
        experience: "",
        location: "",
        industry: "",
        employmentType: "",
        salaryRange: "",
        companyType: "",
        technologyStack: "",
        workMode: ""
      });

      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        setError("Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("An error occurred while loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      setExporting(true);
      const reportId = dashboardData?.analysisReportId || "latest";
      
      if (format === "excel") {
        const response = await apiService.getBlob(`/api/keyword-intelligence/export/${reportId}/excel`);
        if (response.success && response.data) {
          // Create download link
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `keyword-intelligence-report-${Date.now()}.xlsx`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        }
      } else if (format === "pdf") {
        const response = await apiService.get<any>(`/api/keyword-intelligence/export/${reportId}/pdf`);
        if (response.success) {
          alert(response.message || "PDF export is coming soon. Please use Excel export for now.");
        }
      }
    } catch (err) {
      console.error("Error exporting data:", err);
    } finally {
      setExporting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getDemandColor = (demand: string) => {
    switch (demand.toLowerCase()) {
      case "high": return "text-green-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend.toUpperCase()) {
      case "UP": return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case "DOWN": return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing keywords and generating insights...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
              <p className="text-muted-foreground mb-4">{error || "Failed to load dashboard data"}</p>
              <Button onClick={loadDashboardData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-500" />
            AI Keyword Intelligence Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Resume vs Naukri vs LinkedIn Keyword Gap Analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => handleExport("excel")} disabled={exporting}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")} disabled={exporting}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
              {dashboardData.jobDomain || "All Domains"}
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
              {dashboardData.targetRole || "All Roles"}
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
              {dashboardData.experienceLevel || "All Experience"}
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
              {dashboardData.location || "All Locations"}
            </Badge>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overall Health Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="ATS Score"
          score={dashboardData.atsScore}
          icon={<Target className="w-5 h-5" />}
          color="text-blue-500"
        />
        <ScoreCard
          title="Recruiter Visibility"
          score={dashboardData.recruiterVisibilityScore}
          icon={<Search className="w-5 h-5" />}
          color="text-green-500"
        />
        <ScoreCard
          title="Profile Completion"
          score={dashboardData.profileCompletionScore}
          icon={<CheckCircle className="w-5 h-5" />}
          color="text-purple-500"
        />
        <ScoreCard
          title="Keyword Coverage"
          score={dashboardData.keywordCoverageScore}
          icon={<Zap className="w-5 h-5" />}
          color="text-orange-500"
        />
      </div>

      {/* Platform Health Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PlatformHealthCard
          platform="Resume"
          score={dashboardData.resumeHealthScore}
          icon={<FileText className="w-5 h-5" />}
          color="text-blue-500"
        />
        <PlatformHealthCard
          platform="Naukri"
          score={dashboardData.naukriHealthScore}
          icon={<Globe className="w-5 h-5" />}
          color="text-green-500"
        />
        <PlatformHealthCard
          platform="LinkedIn"
          score={dashboardData.linkedinHealthScore}
          icon={<Linkedin className="w-5 h-5" />}
          color="text-blue-600"
        />
      </div>

      {/* Keyword Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Keywords"
          value={dashboardData.totalKeywordsAnalyzed}
          icon={<BarChart3 className="w-4 h-4" />}
        />
        <StatCard
          title="Missing Keywords"
          value={dashboardData.missingKeywordsCount}
          icon={<XCircle className="w-4 h-4 text-red-500" />}
          trend="negative"
        />
        <StatCard
          title="Weak Keywords"
          value={dashboardData.weakKeywordsCount}
          icon={<AlertCircle className="w-4 h-4 text-yellow-500" />}
          trend="warning"
        />
        <StatCard
          title="Trending Skills"
          value={dashboardData.trendingSkillsCount}
          icon={<TrendingUp className="w-4 h-4 text-green-500" />}
          trend="positive"
        />
        <StatCard
          title="Active Job Matches"
          value={dashboardData.activeJobMatches}
          icon={<Briefcase className="w-4 h-4 text-blue-500" />}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="comparison">Platform Comparison</TabsTrigger>
          <TabsTrigger value="resume">Resume Analysis</TabsTrigger>
          <TabsTrigger value="naukri">Naukri Analysis</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn Analysis</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="ats">ATS Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          <KeywordComparisonTable comparisons={dashboardData.keywordComparisons} />
        </TabsContent>

        <TabsContent value="resume" className="space-y-4">
          <PlatformAnalysisPanel platform="resume" data={dashboardData} />
        </TabsContent>

        <TabsContent value="naukri" className="space-y-4">
          <PlatformAnalysisPanel platform="naukri" data={dashboardData} />
        </TabsContent>

        <TabsContent value="linkedin" className="space-y-4">
          <PlatformAnalysisPanel platform="linkedin" data={dashboardData} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <MarketTrendsPanel trends={dashboardData.marketTrendData} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <AIRecommendationsPanel recommendations={dashboardData.aiRecommendations} />
        </TabsContent>

        <TabsContent value="ats" className="space-y-4">
          <ATSAnalysisPanel breakdown={dashboardData.atsBreakdown} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function ScoreCard({ title, score, icon, color }: { title: string; score: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {icon}
              {title}
            </p>
            <p className={cn("text-3xl font-bold mt-2", color)}>{score.toFixed(0)}%</p>
          </div>
          <Progress value={score} className="w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformHealthCard({ platform, score, icon, color }: { platform: string; score: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-lg bg-accent", color)}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{platform} Health</p>
            <p className={cn("text-2xl font-bold", color)}>{score.toFixed(0)}%</p>
            <Progress value={score} className="mt-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, icon, trend }: { title: string; value: number; icon: React.ReactNode; trend?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KeywordComparisonTable({ comparisons }: { comparisons: KeywordComparison[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("demand");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredComparisons = comparisons.filter(c => {
    if (filter === "all") return true;
    if (filter === "missing") return !c.resumePresent || !c.naukriPresent || !c.linkedinPresent;
    if (filter === "high") return c.priority === "HIGH";
    return true;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === "demand") comparison = b.marketDemandScore - a.marketDemandScore;
    if (sortBy === "keyword") comparison = a.keyword.localeCompare(b.keyword);
    if (sortBy === "impact") comparison = b.atsImpactScore - a.atsImpactScore;
    return sortOrder === "asc" ? -comparison : comparison;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Keyword Comparison</CardTitle>
            <CardDescription>Compare your keywords across Resume, Naukri, and LinkedIn</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "missing" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("missing")}
            >
              Missing
            </Button>
            <Button
              variant={filter === "high" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("high")}
            >
              High Priority
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑" : "↓"} Sort
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 cursor-pointer hover:bg-accent" onClick={() => setSortBy("keyword")}>
                  Keyword {sortBy === "keyword" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left p-3 cursor-pointer hover:bg-accent" onClick={() => setSortBy("demand")}>
                  Demand {sortBy === "demand" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-center p-3">Resume</th>
                <th className="text-center p-3">Naukri</th>
                <th className="text-center p-3">LinkedIn</th>
                <th className="text-left p-3">Priority</th>
                <th className="text-left p-3 cursor-pointer hover:bg-accent" onClick={() => setSortBy("impact")}>
                  Impact {sortBy === "impact" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left p-3">Placement</th>
              </tr>
            </thead>
            <tbody>
              {filteredComparisons.map((comparison, index) => (
                <tr key={index} className="border-b hover:bg-accent/50">
                  <td className="p-3 font-medium">{comparison.keyword}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getDemandColor(comparison.demandLevel)}>
                        {comparison.demandLevel}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{comparison.marketDemandScore}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    {comparison.resumePresent ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {comparison.naukriPresent ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {comparison.linkedinPresent ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="p-3">
                    <Badge className={getPriorityColor(comparison.priority)}>
                      {comparison.priority}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">+{comparison.atsImpactScore}% ATS</span>
                      <span className="text-xs text-muted-foreground">+{comparison.recruiterVisibilityImpact}% Visibility</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {comparison.recommendedSections.slice(0, 2).map((section, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{section}</Badge>
                      ))}
                      {comparison.recommendedSections.length > 2 && (
                        <Badge variant="secondary" className="text-xs">+{comparison.recommendedSections.length - 2}</Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredComparisons.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No keywords match the current filter
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MarketTrendsPanel({ trends }: { trends: MarketTrendData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <TrendMetricCard
          title="Total Jobs Analyzed"
          value={trends.totalJobsAnalyzed}
          icon={<Briefcase className="w-4 h-4" />}
          color="text-blue-500"
        />
        <TrendMetricCard
          title="Recruiters Analyzed"
          value={trends.recruitersAnalyzed}
          icon={<Search className="w-4 h-4" />}
          color="text-green-500"
        />
        <TrendMetricCard
          title="Trending Technologies"
          value={trends.trendingTechnologiesCount}
          icon={<TrendingUp className="w-4 h-4" />}
          color="text-purple-500"
        />
        <TrendMetricCard
          title="Emerging Skills"
          value={trends.emergingSkills}
          icon={<Sparkles className="w-4 h-4" />}
          color="text-yellow-500"
        />
        <TrendMetricCard
          title="Declining Skills"
          value={trends.decliningSkills}
          icon={<ArrowDownRight className="w-4 h-4" />}
          color="text-red-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Trending Technologies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trends.trendingTechnologies.slice(0, 6).map((tech, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(tech.trend)}
                    <span className="font-medium">{tech.technology}</span>
                  </div>
                  <Badge variant={tech.growthPercentage > 0 ? "default" : "destructive"}>
                    {tech.growthPercentage > 0 ? "+" : ""}{tech.growthPercentage.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Hiring Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trends.topHiringCompanies.slice(0, 6).map((company, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50">
                  <div>
                    <p className="font-medium">{company.companyName}</p>
                    <p className="text-sm text-muted-foreground">{company.industry}</p>
                  </div>
                  <Badge variant="outline">{company.jobPostingCount} jobs</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Searched Technologies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trends.mostSearchedTechnologies.map((tech, index) => (
                <Badge key={index} variant="secondary" className="text-sm">{tech}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Hiring Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trends.topHiringLocations.map((location, index) => (
                <Badge key={index} variant="outline" className="text-sm">{location}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fastest Growing Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trends.fastestGrowingSkills.map((skill, index) => (
                <Badge key={index} className="bg-green-500 text-white text-sm">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Requested Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trends.mostRequestedCertifications.map((cert, index) => (
                <Badge key={index} variant="secondary" className="text-sm">{cert}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TrendMetricCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-accent", color)}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AIRecommendationsPanel({ recommendations }: { recommendations: AIRecommendations }) {
  return (
    <div className="space-y-6">
      <RecommendationSection
        title="High Priority"
        recommendations={recommendations.highPriorityRecommendations}
        color="red"
      />
      <RecommendationSection
        title="Medium Priority"
        recommendations={recommendations.mediumPriorityRecommendations}
        color="yellow"
      />
      <RecommendationSection
        title="Low Priority"
        recommendations={recommendations.lowPriorityRecommendations}
        color="green"
      />
    </div>
  );
}

function RecommendationSection({ title, recommendations, color }: { title: string; recommendations: Recommendation[]; color: string }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className={`w-5 h-5 text-${color}-500`} />
          {title} ({recommendations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-lg">{rec.keyword}</h4>
                  <Badge variant="outline">{rec.category}</Badge>
                </div>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                  <Badge variant="outline">Demand: {rec.marketDemand}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">{rec.status}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Market Demand</p>
                  <p className="font-medium">{rec.marketDemand}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ATS Improvement</p>
                  <p className="font-medium text-green-500">+{rec.atsImprovement}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Visibility Improvement</p>
                  <p className="font-medium text-blue-500">+{rec.recruiterVisibilityImprovement}%</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">AI Suggestion</p>
                <p className="text-sm">{rec.aiSuggestion}</p>
              </div>

              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">Recommended Sections</p>
                <div className="flex flex-wrap gap-2">
                  {rec.recommendedSections.map((section, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {section}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="w-3 h-3" />
                <span>Adding this keyword can improve your overall profile score and increase recruiter discoverability</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ATSAnalysisPanel({ breakdown }: { breakdown: ATSBreakdown }) {
  const scores = [
    { name: "Skills", score: breakdown.skillsScore, icon: <Zap className="w-4 h-4" /> },
    { name: "Projects", score: breakdown.projectsScore, icon: <Briefcase className="w-4 h-4" /> },
    { name: "Experience", score: breakdown.experienceScore, icon: <Award className="w-4 h-4" /> },
    { name: "Keywords", score: breakdown.keywordsScore, icon: <Search className="w-4 h-4" /> },
    { name: "Certifications", score: breakdown.certificationsScore, icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const overallATSScore = Math.round(
    scores.reduce((acc, item) => acc + item.score, 0) / scores.length
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>ATS Score Breakdown</CardTitle>
          <CardDescription>Detailed analysis of your ATS compatibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center pb-4 border-b">
            <p className="text-sm text-muted-foreground mb-1">Overall ATS Score</p>
            <p className={cn("text-4xl font-bold", getScoreColor(overallATSScore))}>
              {overallATSScore}%
            </p>
          </div>
          
          {scores.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className={cn("font-bold", getScoreColor(item.score))}>{item.score.toFixed(0)}%</span>
              </div>
              <Progress value={item.score} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Improvement Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium">Add Missing Certifications</p>
                <p className="text-sm text-muted-foreground">
                  Your certifications score is {breakdown.certificationsScore.toFixed(0)}%. Adding relevant certifications can improve your ATS score by up to 15%.
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Enhance Project Descriptions</p>
                <p className="text-sm text-muted-foreground">
                  Add more technical details and quantified achievements to your project descriptions.
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium">Optimize Keyword Placement</p>
                <p className="text-sm text-muted-foreground">
                  Ensure high-demand keywords appear in your skills, summary, and experience sections.
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Quantify Achievements</p>
                <p className="text-sm text-muted-foreground">
                  Add measurable results and metrics to demonstrate impact.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Utility functions
function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high": return "bg-red-500";
    case "medium": return "bg-yellow-500";
    case "low": return "bg-green-500";
    default: return "bg-gray-500";
  }
}

function getDemandColor(demand: string): string {
  switch (demand.toLowerCase()) {
    case "high": return "text-green-500 border-green-500";
    case "medium": return "text-yellow-500 border-yellow-500";
    case "low": return "text-red-500 border-red-500";
    default: return "text-gray-500 border-gray-500";
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
}

function getTrendIcon(trend: string) {
  switch (trend.toUpperCase()) {
    case "UP": return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    case "DOWN": return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    default: return <Minus className="w-4 h-4 text-gray-500" />;
  }
}

function PlatformAnalysisPanel({ platform, data }: { platform: string; data: DashboardData }) {
  const platformData = {
    resume: {
      healthScore: data.resumeHealthScore,
      icon: <FileText className="w-5 h-5" />,
      color: "text-blue-500",
      sections: [
        { name: "ATS Score", score: data.atsScore },
        { name: "Skills", score: data.atsBreakdown?.skillsScore || 0 },
        { name: "Projects", score: data.atsBreakdown?.projectsScore || 0 },
        { name: "Experience", score: data.atsBreakdown?.experienceScore || 0 },
        { name: "Keywords", score: data.atsBreakdown?.keywordsScore || 0 },
        { name: "Certifications", score: data.atsBreakdown?.certificationsScore || 0 },
      ]
    },
    naukri: {
      healthScore: data.naukriHealthScore,
      icon: <Globe className="w-5 h-5" />,
      color: "text-green-500",
      sections: [
        { name: "Profile Completeness", score: data.naukriHealthScore },
        { name: "Key Skills", score: data.keywordCoverageScore },
        { name: "Headline Keywords", score: 85 },
        { name: "Summary Keywords", score: 78 },
        { name: "Recruiter Visibility", score: data.recruiterVisibilityScore },
      ]
    },
    linkedin: {
      healthScore: data.linkedinHealthScore,
      icon: <Linkedin className="w-5 h-5" />,
      color: "text-blue-600",
      sections: [
        { name: "Profile Strength", score: data.linkedinHealthScore },
        { name: "Headline Analysis", score: 82 },
        { name: "About Section", score: 75 },
        { name: "Skills Analysis", score: data.keywordCoverageScore },
        { name: "Experience Analysis", score: 88 },
        { name: "Featured Section", score: 70 },
      ]
    }
  };

  const currentPlatform = platformData[platform as keyof typeof platformData];
  const platformKeywords = data.keywordComparisons.filter(k => {
    if (platform === "resume") return !k.resumePresent || k.resumeStrength === "WEAK";
    if (platform === "naukri") return !k.naukriPresent || k.naukriStrength === "WEAK";
    if (platform === "linkedin") return !k.linkedinPresent || k.linkedinStrength === "WEAK";
    return false;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentPlatform.icon}
            {platform.charAt(0).toUpperCase() + platform.slice(1)} Health Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Health Score</span>
            <span className={cn("text-2xl font-bold", currentPlatform.color)}>
              {currentPlatform.healthScore.toFixed(0)}%
            </span>
          </div>
          <Progress value={currentPlatform.healthScore} className="h-2" />
          
          <Separator />
          
          <div className="space-y-3">
            {currentPlatform.sections.map((section, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{section.name}</span>
                  <span className={cn("text-sm font-bold", getScoreColor(section.score))}>
                    {section.score.toFixed(0)}%
                  </span>
                </div>
                <Progress value={section.score} className="h-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Missing & Weak Keywords
            <Badge variant="outline" className="ml-2">{platformKeywords.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {platformKeywords.slice(0, 10).map((keyword, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(keyword.priority)}>{keyword.priority}</Badge>
                  <span className="font-medium">{keyword.keyword}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getDemandColor(keyword.demandLevel)}>
                    {keyword.demandLevel}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {keyword.category}
                  </span>
                </div>
              </div>
            ))}
            {platformKeywords.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>All keywords are optimized!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Suggested Improvements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platform === "resume" && (
              <>
                <ImprovementCard
                  icon={<Zap className="w-5 h-5 text-yellow-500" />}
                  title="Add Missing Certifications"
                  description="Your certifications score is {data.atsBreakdown?.certificationsScore.toFixed(0)}%. Adding relevant certifications can improve your ATS score by up to 15%."
                  impact="+15% ATS"
                />
                <ImprovementCard
                  icon={<Briefcase className="w-5 h-5 text-blue-500" />}
                  title="Enhance Project Descriptions"
                  description="Add more technical details and quantified achievements to your project descriptions."
                  impact="+10% Visibility"
                />
                <ImprovementCard
                  icon={<Search className="w-5 h-5 text-green-500" />}
                  title="Optimize Keyword Placement"
                  description="Ensure high-demand keywords appear in your skills, summary, and experience sections."
                  impact="+8% ATS"
                />
                <ImprovementCard
                  icon={<Target className="w-5 h-5 text-purple-500" />}
                  title="Add Measurable Achievements"
                  description="Include quantified results and metrics in your experience descriptions."
                  impact="+12% Impact"
                />
              </>
            )}
            {platform === "naukri" && (
              <>
                <ImprovementCard
                  icon={<Globe className="w-5 h-5 text-green-500" />}
                  title="Optimize Key Skills Section"
                  description="Add all high-demand technical skills to your Naukri key skills section."
                  impact="+20% Visibility"
                />
                <ImprovementCard
                  icon={<Edit className="w-5 h-5 text-blue-500" />}
                  title="Enhance Headline Keywords"
                  description="Include target role and key technologies in your profile headline."
                  impact="+15% Search"
                />
                <ImprovementCard
                  icon={<FileText className="w-5 h-5 text-purple-500" />}
                  title="Improve Summary Section"
                  description="Add a compelling summary with relevant keywords and career highlights."
                  impact="+18% Profile"
                />
                <ImprovementCard
                  icon={<Award className="w-5 h-5 text-yellow-500" />}
                  title="Update Profile Completeness"
                  description="Complete all profile sections to maximize recruiter visibility."
                  impact="+25% Complete"
                />
              </>
            )}
            {platform === "linkedin" && (
              <>
                <ImprovementCard
                  icon={<Linkedin className="w-5 h-5 text-blue-600" />}
                  title="Optimize LinkedIn Headline"
                  description="Create a keyword-rich headline that includes your target role and key skills."
                  impact="+22% Search"
                />
                <ImprovementCard
                  icon={<FileText className="w-5 h-5 text-green-500" />}
                  title="Enhance About Section"
                  description="Write a compelling about section with relevant keywords and achievements."
                  impact="+18% Profile"
                />
                <ImprovementCard
                  icon={<Briefcase className="w-5 h-5 text-purple-500" />}
                  title="Showcase Featured Projects"
                  description="Add featured projects with detailed descriptions and media."
                  impact="+15% Visibility"
                />
                <ImprovementCard
                  icon={<Zap className="w-5 h-5 text-yellow-500" />}
                  title="Endorse Skills & Recommendations"
                  description="Get endorsements for key skills and collect recommendations."
                  impact="+20% Credibility"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ImprovementCard({ icon, title, description, impact }: { icon: React.ReactNode; title: string; description: string; impact: string }) {
  return (
    <div className="p-4 rounded-lg border hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-accent">{icon}</div>
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground mb-2">{description}</p>
          <Badge variant="secondary" className="text-xs">{impact}</Badge>
        </div>
      </div>
    </div>
  );
}