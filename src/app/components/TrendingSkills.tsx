import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp, TrendingDown, Flame, Star, Target, BookOpen,
  RefreshCw, AlertCircle, CheckCircle, Info, ExternalLink,
  ArrowUpRight, Filter, Search, X, Sparkles, Brain, Award,
  BarChart3, LineChart, Clock, Users, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "./ui/utils";
import { useIsMobile } from "./ui/use-mobile";
import { dashboardService, type TrendingSkill } from "../../services/dashboardService";
import { apiService } from "../../services/api";
import type { NavSection } from "./Sidebar";

interface TrendingSkillsProps {
  onNavigate?: (section: NavSection, settingsSection?: string) => void;
}

interface UserProfile {
  skills?: Array<{ name: string; level?: string }>;
  currentDesignation?: string;
  yearsOfExperience?: number | string;
  industry?: string;
}

interface SkillWithGap extends TrendingSkill {
  hasSkill: boolean;
  skillLevel?: string;
  gap: "learned" | "learning" | "missing";
  learningResources?: Array<{ title: string; type: string; url: string }>;
}

interface SkillCategory {
  name: string;
  icon: any;
  color: string;
  skills: SkillWithGap[];
}

export function TrendingSkills({ onNavigate }: TrendingSkillsProps) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendingSkills, setTrendingSkills] = useState<TrendingSkill[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [skillsWithGap, setSkillsWithGap] = useState<SkillWithGap[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "missing" | "learned">("all");
  const [selectedPriority, setSelectedPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Analyze skill gaps whenever data changes
  useEffect(() => {
    if (trendingSkills.length > 0 && userProfile) {
      analyzeSkillGaps();
    }
  }, [trendingSkills, userProfile]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load trending skills and user profile in parallel
      const [skillsResponse, profileResponse] = await Promise.all([
        dashboardService.getTrendingSkills(),
        apiService.get<any>("/api/profile")
      ]);

      if (skillsResponse.success && Array.isArray(skillsResponse.data)) {
        setTrendingSkills(skillsResponse.data);
      } else {
        setTrendingSkills([]);
      }

      if (profileResponse.success && profileResponse.data) {
        const payload = profileResponse.data;
        const userData = payload.user || payload;
        setUserProfile(userData);
      }
    } catch (err) {
      console.error("Error loading trending skills:", err);
      setError("Failed to load trending skills data");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      const response = await dashboardService.refreshTrendingSkills();
      if (response.success && Array.isArray(response.data)) {
        setTrendingSkills(response.data);
      }
    } catch (err) {
      console.error("Error refreshing skills:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const analyzeSkillGaps = () => {
    const userSkills = userProfile?.skills || [];
    const userSkillNames = userSkills.map(s => s.name.toLowerCase());

    const analyzed: SkillWithGap[] = trendingSkills.map(skill => {
      const hasSkill = userSkillNames.includes(skill.name.toLowerCase());
      const userSkill = userSkills.find(s => s.name.toLowerCase() === skill.name.toLowerCase());
      
      return {
        ...skill,
        hasSkill,
        skillLevel: userSkill?.level,
        gap: hasSkill ? "learned" : "missing",
        learningResources: generateLearningResources(skill.name)
      };
    });

    setSkillsWithGap(analyzed);
  };

  const generateLearningResources = (skillName: string) => {
    // In real implementation, this would come from the backend
    // For now, generate some placeholder resources
    const resources = [
      { title: `${skillName} Documentation`, type: "docs", url: `#docs-${skillName}` },
      { title: `Learn ${skillName}`, type: "course", url: `#course-${skillName}` },
      { title: `${skillName} Tutorial`, type: "video", url: `#video-${skillName}` }
    ];
    return resources;
  };

  // Filter and search logic
  const filteredSkills = skillsWithGap.filter(skill => {
    // Tab filter
    if (selectedTab === "missing" && skill.gap !== "missing") return false;
    if (selectedTab === "learned" && skill.gap !== "learned") return false;

    // Priority filter
    if (selectedPriority !== "all" && skill.priority !== selectedPriority) return false;

    // Search filter
    if (searchQuery && !skill.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Calculate statistics
  const stats = {
    total: skillsWithGap.length,
    learned: skillsWithGap.filter(s => s.gap === "learned").length,
    missing: skillsWithGap.filter(s => s.gap === "missing").length,
    highPriority: skillsWithGap.filter(s => s.priority === "high").length,
    matchPercentage: skillsWithGap.length > 0 
      ? Math.round((skillsWithGap.filter(s => s.gap === "learned").length / skillsWithGap.length) * 100)
      : 0
  };

  // Helper to map backend categories to frontend styling config
  const getCategoryConfig = (categoryName?: string) => {
    const name = (categoryName || "Other").trim().toLowerCase();
    if (name.includes("programming language") || name.includes("language")) {
      return { name: "Programming Languages", icon: Zap, color: "text-chart-1" };
    }
    if (name.includes("framework") || name.includes("library")) {
      return { name: "Frameworks & Libraries", icon: Target, color: "text-chart-2" };
    }
    if (name.includes("cloud") || name.includes("devops")) {
      return { name: "Cloud & DevOps", icon: BarChart3, color: "text-chart-3" };
    }
    if (name.includes("database") || name.includes("sql") || name.includes("no-sql")) {
      return { name: "Databases", icon: LineChart, color: "text-chart-4" };
    }
    if (name.includes("tool") || name.includes("platform") || name.includes("ide")) {
      return { name: "Tools & Platforms", icon: Award, color: "text-chart-5" };
    }
    if (name.includes("soft skill") || name.includes("soft")) {
      return { name: "Soft Skills", icon: Star, color: "text-muted-foreground" };
    }
    // Fallback to title case for any custom category returned by the backend
    const titleCaseName = categoryName
      ? categoryName.split(/[\s/_/-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      : "Technical Skills";
    return { name: titleCaseName, icon: Star, color: "text-muted-foreground" };
  };

  // Group skills by category dynamically based on backend data
  const categorizeSkills = (): SkillCategory[] => {
    const categoryMap: Record<string, SkillWithGap[]> = {};

    filteredSkills.forEach(skill => {
      const categoryName = skill.category || "Technical";
      const config = getCategoryConfig(categoryName);
      const groupName = config.name;
      
      if (!categoryMap[groupName]) {
        categoryMap[groupName] = [];
      }
      categoryMap[groupName].push(skill);
    });

    const categoriesList: SkillCategory[] = Object.keys(categoryMap).map(groupName => {
      const skillsInGroup = categoryMap[groupName];
      const sampleSkillCategory = skillsInGroup[0].category || "Technical";
      const config = getCategoryConfig(sampleSkillCategory);
      return {
        name: groupName,
        icon: config.icon,
        color: config.color,
        skills: skillsInGroup
      };
    });

    // Consistent order for standard developer categories
    const order = ["Programming Languages", "Frameworks & Libraries", "Cloud & DevOps", "Databases", "Tools & Platforms", "Soft Skills"];
    categoriesList.sort((a, b) => {
      const indexA = order.indexOf(a.name);
      const indexB = order.indexOf(b.name);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return categoriesList;
  };

  const categories = categorizeSkills();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="animate-spin text-primary mx-auto mb-3" size={32} />
          <p className="text-sm text-foreground">Analyzing market trends...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Gathering data from job postings across platforms
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-destructive mx-auto mb-3" size={32} />
          <p className="text-sm text-foreground mb-2">{error}</p>
          <p className="text-xs text-muted-foreground mb-4">
            We analyze publicly available job postings and hiring trends
          </p>
          <Button size="sm" variant="outline" onClick={loadData}>
            <RefreshCw size={14} className="mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className={cn("space-y-6 max-w-[1400px] mx-auto", isMobile ? "p-4" : "p-6")}>
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-1/20 to-chart-3/20 flex items-center justify-center">
                <Flame size={20} className="text-chart-1" />
              </div>
              <div>
                <h1 className={cn("font-bold text-foreground", isMobile ? "text-xl" : "text-2xl")}>
                  Trending Skills in Your Field
                </h1>
                <p className={cn("text-muted-foreground mt-1", isMobile ? "text-xs" : "text-sm")}>
                  Discover in-demand skills based on publicly available job postings and hiring trends
                  from platforms such as LinkedIn and Naukri
                </p>
              </div>
            </div>
            <Button
              size={isMobile ? "sm" : "default"}
              variant="outline"
              onClick={refreshData}
              disabled={refreshing}
              className="shrink-0"
            >
              <RefreshCw size={14} className={cn("mr-2", refreshing && "animate-spin")} />
              {!isMobile && "Refresh"}
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className={cn("grid gap-3", isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
          {[
            { label: "Trending Skills", value: stats.total, icon: Flame, color: "text-chart-1", bg: "bg-chart-1/10" },
            { label: "Skills Match", value: `${stats.matchPercentage}%`, icon: CheckCircle, color: "text-chart-3", bg: "bg-chart-3/10" },
            { label: "Skills to Learn", value: stats.missing, icon: Target, color: "text-chart-4", bg: "bg-chart-4/10" },
            { label: "High Priority", value: stats.highPriority, icon: Star, color: "text-destructive", bg: "bg-destructive/10" }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
            >
              <Card className="p-4 border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bg)}>
                    <stat.icon size={18} className={stat.color} />
                  </div>
                  <div>
                    <p className={cn("font-bold text-foreground", isMobile ? "text-xl" : "text-2xl")}>
                      {stat.value}
                    </p>
                    <p className={cn("text-muted-foreground", isMobile ? "text-[10px]" : "text-xs")}>
                      {stat.label}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Info Banner */}
        {stats.matchPercentage < 50 && stats.missing > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-chart-4/30 bg-chart-4/5 p-4"
          >
            <div className="flex items-start gap-3">
              <Info size={18} className="text-chart-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className={cn("font-medium text-foreground", isMobile ? "text-xs" : "text-sm")}>
                  Skill Gap Opportunity
                </p>
                <p className={cn("text-muted-foreground mt-1", isMobile ? "text-[11px]" : "text-xs")}>
                  Learning these trending skills can significantly improve your job match rate
                  and make you more competitive in the market.
                </p>
              </div>
              {onNavigate && (
                <Button size="sm" variant="outline" onClick={() => onNavigate("profile")}>
                  Update Profile
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className={cn("flex gap-3", isMobile ? "flex-col" : "flex-row items-center")}>
              {/* Search */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as any)}
                  className={cn(
                    "px-3 py-2 rounded-md border border-input bg-background text-foreground",
                    isMobile ? "text-xs" : "text-sm"
                  )}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="text-xs">
              All Skills ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="missing" className="text-xs">
              To Learn ({stats.missing})
            </TabsTrigger>
            <TabsTrigger value="learned" className="text-xs">
              You Have ({stats.learned})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6 space-y-6">
            {categories.length === 0 ? (
              <Card className="border-border">
                <CardContent className="p-12 text-center">
                  <AlertCircle size={32} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? `No skills found matching "${searchQuery}"`
                      : "No trending skills data available"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              categories.map((category, catIndex) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: catIndex * 0.1 }}
                >
                  <Card className="border-border">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <category.icon size={18} className={category.color} />
                        <CardTitle className="text-base">{category.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {category.skills.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {category.skills.map((skill) => (
                        <SkillCard key={skill.name} skill={skill} isMobile={isMobile} />
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Data Source Disclaimer */}
        <Card className="border-border bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info size={16} className="text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className={cn("text-muted-foreground", isMobile ? "text-[11px]" : "text-xs")}>
                  <span className="font-medium">Data Source:</span> Skills analysis is based on publicly 
                  available job postings and hiring trends aggregated from various platforms including
                  LinkedIn and Naukri. Data is refreshed periodically to reflect current market demands.
                  Individual results may vary based on location, industry, and experience level.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Skill Card Component
function SkillCard({ skill, isMobile }: { skill: SkillWithGap; isMobile: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high": return "text-destructive";
      case "medium": return "text-chart-4";
      case "low": return "text-muted-foreground";
      default: return "text-muted-foreground";
    }
  };

  const getPriorityBg = (priority?: string) => {
    switch (priority) {
      case "high": return "bg-destructive/10";
      case "medium": return "bg-chart-4/10";
      case "low": return "bg-muted/50";
      default: return "bg-muted/50";
    }
  };

  return (
    <div className="group relative">
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1",
          skill.gap === "learned" ? "bg-chart-3/10" : "bg-muted"
        )}>
          {skill.gap === "learned" ? (
            <CheckCircle size={16} className="text-chart-3" />
          ) : (
            <Target size={16} className="text-muted-foreground" />
          )}
        </div>

        {/* Skill Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={cn("font-semibold text-foreground", isMobile ? "text-sm" : "text-base")}>
                  {skill.name}
                </h4>
                {skill.priority && (
                  <Badge
                    variant="secondary"
                    className={cn("text-[10px] h-5 px-2 capitalize", getPriorityBg(skill.priority))}
                  >
                    <span className={getPriorityColor(skill.priority)}>{skill.priority}</span>
                  </Badge>
                )}
                {skill.gap === "learned" && skill.skillLevel && (
                  <Badge variant="outline" className="text-[10px] h-5 px-2">
                    {skill.skillLevel}
                  </Badge>
                )}
              </div>
              
              {/* Growth Indicator */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className={cn("text-muted-foreground", isMobile ? "text-[11px]" : "text-xs")}>
                    Demand:
                  </span>
                  <div className="flex items-center gap-1">
                    {skill.growth?.startsWith("+") ? (
                      <TrendingUp size={12} className="text-chart-3" />
                    ) : (
                      <TrendingDown size={12} className="text-destructive" />
                    )}
                    <span className={cn(
                      "font-medium",
                      skill.growth?.startsWith("+") ? "text-chart-3" : "text-destructive",
                      isMobile ? "text-[11px]" : "text-xs"
                    )}>
                      {skill.growth || "N/A"}
                    </span>
                  </div>
                </div>
                
                {typeof skill.demand === "number" && (
                  <div className="flex items-center gap-2">
                    <span className={cn("text-muted-foreground", isMobile ? "text-[11px]" : "text-xs")}>
                      Market:
                    </span>
                    <span className={cn("font-medium text-foreground", isMobile ? "text-[11px]" : "text-xs")}>
                      {skill.demand}%
                    </span>
                  </div>
                )}
              </div>

              {/* Demand Bar */}
              <div className="mt-2">
                <Progress value={skill.demand || 0} className="h-1.5" />
              </div>
            </div>

            {/* Expand Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="shrink-0"
            >
              <ArrowUpRight
                size={14}
                className={cn("transition-transform", expanded && "rotate-45")}
              />
            </Button>
          </div>

          {/* Expanded Content */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-border space-y-3"
            >
              {skill.explanation && (
                <div>
                  <p className={cn("text-muted-foreground", isMobile ? "text-[11px]" : "text-xs")}>
                    {skill.explanation}
                  </p>
                </div>
              )}

              {/* Metrics */}
              <div className="flex flex-wrap gap-4">
                {typeof skill.frequency === "number" && skill.frequency > 0 && (
                  <div className="flex items-center gap-2">
                    <BarChart3 size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Frequency: <span className="font-medium text-foreground">{skill.frequency}</span>
                    </span>
                  </div>
                )}
                {skill.impact && (
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Impact: <span className="font-medium text-foreground capitalize">{skill.impact}</span>
                    </span>
                  </div>
                )}
                {typeof skill.recommendation_score === "number" && (
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Score: <span className="font-medium text-foreground">{skill.recommendation_score}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Learning Resources */}
              {skill.gap === "missing" && skill.learningResources && skill.learningResources.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={14} className="text-chart-2" />
                    <span className="text-xs font-medium text-foreground">Learning Resources</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skill.learningResources.map((resource, idx) => (
                      <a
                        key={idx}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/70 transition-colors text-xs text-foreground"
                      >
                        <span>{resource.title}</span>
                        <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
