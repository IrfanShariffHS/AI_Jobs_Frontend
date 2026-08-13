import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, MapPin, DollarSign, Briefcase, Clock, Bookmark,
  BookmarkCheck, Brain, ExternalLink, Building2, Users, Star,
  Filter, X, ChevronDown, Sparkles, SlidersHorizontal, RefreshCw, AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { type Job } from "./data";
import { cn } from "./ui/utils";
import type { NavSection } from "./Sidebar";
import { jobService } from "../../services/jobService";
import { toast } from "sonner";

interface JobSearchProps {
  onNavigate: (section: NavSection, settingsSection?: string) => void;
  onSelectJob?: (job: Job) => void;
}

// Dynamic categories and job types - will be populated from API
const categories = ["All", "Engineering", "AI/ML", "Design", "Data Science", "DevOps", "Mobile", "Product"];
const jobTypes = ["All Types", "Full-time", "Part-time", "Contract", "Remote", "Hybrid"];

function MatchBadge({ score }: { score: number }) {
  const color = score >= 90 ? "text-chart-3 bg-chart-3/15 border-chart-3/30"
    : score >= 75 ? "text-chart-2 bg-chart-2/15 border-chart-2/30"
    : "text-chart-4 bg-chart-4/15 border-chart-4/30";
  return (
    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", color)}>
      {score}% match
    </span>
  );
}

function JobCard({
  job,
  selected,
  onSelect,
  onToggleSave,
}: {
  job: Job;
  selected: boolean;
  onSelect: () => void;
  onToggleSave: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-150 hover:border-primary/40 border",
          selected ? "border-primary/60 bg-primary/5" : "border-border"
        )}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Company logo placeholder */}
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Building2 size={16} className="text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold text-foreground truncate">{job.title}</h3>
                  <p className="text-[12px] text-muted-foreground">{job.company}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <MatchBadge score={job.matchScore} />
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {job.saved
                      ? <BookmarkCheck size={15} className="text-primary" />
                      : <Bookmark size={15} />
                    }
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin size={10} /> {job.location}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <DollarSign size={10} /> {job.salary}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Briefcase size={10} /> {job.experience}
                </span>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{job.type}</Badge>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {job.skills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded border",
                      job.missingSkills.includes(skill)
                        ? "border-chart-4/40 text-chart-4 bg-chart-4/10"
                        : "border-border text-muted-foreground bg-muted/50"
                    )}
                  >
                    {skill}
                  </span>
                ))}
                {job.skills.length > 4 && (
                  <span className="text-[10px] text-muted-foreground px-1">+{job.skills.length - 4}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Users size={9} /> {job.applicants.toLocaleString()} applicants
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock size={9} /> Posted {job.postedAt}
              </span>
            </div>
            {job.missingSkills.length > 0 && (
              <span className="text-[10px] text-chart-4">
                {job.missingSkills.length} missing skill{job.missingSkills.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function JobDetailPanel({ job, onApply }: { job: Job; onApply: () => void }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-5 space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Building2 size={22} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground">{job.title}</h2>
              <p className="text-sm text-muted-foreground">{job.company}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className="text-xs gap-1"><MapPin size={10} /> {job.location}</Badge>
            <Badge variant="secondary" className="text-xs gap-1"><DollarSign size={10} /> {job.salary}</Badge>
            <Badge variant="secondary" className="text-xs gap-1"><Briefcase size={10} /> {job.type}</Badge>
          </div>

          <div className="flex gap-2 mt-4">
            <Button className="flex-1 gap-1.5" size="sm" onClick={onApply}>
              <ExternalLink size={13} /> Apply Now
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Bookmark size={13} /> Save
            </Button>
          </div>
        </div>

        <Separator />

        {/* AI Match */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={15} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">AI Match Analysis</span>
            <span className="ml-auto text-xl font-bold text-primary">{job.matchScore}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${job.matchScore}%` }}
            />
          </div>
          <div className="space-y-1.5">
            {job.matchAnalysis && (
              <p className="text-[12px] text-muted-foreground line-clamp-3">{job.matchAnalysis}</p>
            )}
            {job.autoApplyReason && (
              <p className="text-[11px] text-muted-foreground">{job.autoApplyReason}</p>
            )}
            {job.matchingSkills && job.matchingSkills.length > 0 && (
              <p className="text-[12px] text-chart-3">
                Matching: {job.matchingSkills.join(", ")}
              </p>
            )}
            {job.missingSkills.length > 0 && (
              <p className="text-[12px] text-chart-4">
                Missing: {job.missingSkills.join(", ")}
              </p>
            )}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {job.experienceMatch != null && (
                <p className="text-[10px] text-muted-foreground">Experience {job.experienceMatch}%</p>
              )}
              {job.educationMatch != null && (
                <p className="text-[10px] text-muted-foreground">Education {job.educationMatch}%</p>
              )}
              {job.keywordMatch != null && (
                <p className="text-[10px] text-muted-foreground">Keywords {job.keywordMatch}%</p>
              )}
              {job.recruiterRelevance != null && (
                <p className="text-[10px] text-muted-foreground">Recruiter {job.recruiterRelevance}%</p>
              )}
            </div>
            {job.profileImprovements && job.profileImprovements.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-medium text-foreground mb-1">Improve your match</p>
                <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-0.5">
                  {job.profileImprovements.slice(0, 4).map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">About the Role</h4>
          <p className="text-[13px] text-foreground leading-relaxed">{job.description}</p>
        </div>

        {/* Skills */}
        <div>
          <h4 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Required Skills</h4>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className={cn(
                  "text-xs",
                  job.missingSkills.includes(skill)
                    ? "border-chart-4/40 text-chart-4 bg-chart-4/10"
                    : "border-chart-3/40 text-chart-3 bg-chart-3/10"
                )}
              >
                {job.missingSkills.includes(skill) ? "✕ " : "✓ "}{skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div>
          <h4 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Benefits</h4>
          <div className="flex flex-wrap gap-1.5">
            {job.benefits.map((benefit) => (
              <Badge key={benefit} variant="secondary" className="text-xs">{benefit}</Badge>
            ))}
          </div>
        </div>

        {/* Recruiter */}
        {job.recruiterName ? (
        <div className="rounded-xl bg-muted/50 p-4">
          <h4 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recruiter</h4>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-[12px] font-semibold text-primary">
                {job.recruiterName.split(" ").map(n => n[0]).join("")}
              </span>
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground">{job.recruiterName}</p>
              <p className="text-[11px] text-muted-foreground">{job.recruiterTitle}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3 text-xs h-7">
            Send Email
          </Button>
        </div>
        ) : null}

        {/* ATS Score */}
        <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
          <div>
            <p className="text-[12px] font-medium text-foreground">ATS Compatibility</p>
            <p className="text-[11px] text-muted-foreground">Resume scan score</p>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-xl font-bold",
              job.atsScore >= 85 ? "text-chart-3" : job.atsScore >= 70 ? "text-chart-4" : "text-destructive"
            )}>
              {job.atsScore}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JobSearch({ onNavigate }: JobSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [salaryRange, setSalaryRange] = useState([80000, 250000]);
  const [selectedType, setSelectedType] = useState("All Types");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(categories);
  const [dynamicJobTypes, setDynamicJobTypes] = useState<string[]>(jobTypes);

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        const response = await jobService.getJobListings();
        if (response.success && response.data) {
          // Transform API data to match Job interface
          const transformedJobs = (response.data.jobs || []).map((apiJob: any) => {
            const breakdown = apiJob.matchBreakdown || {};
            const toSkillList = (value: unknown): string[] => {
              if (Array.isArray(value)) return value.map(String).map(s => s.trim()).filter(Boolean);
              if (typeof value === "string" && value.trim()) {
                return value.split(",").map(s => s.trim()).filter(Boolean);
              }
              return [];
            };
            const missingSkills = toSkillList(apiJob.missingSkills ?? breakdown.missing_skills);
            const matchingSkills = toSkillList(apiJob.matchingSkills ?? breakdown.matching_skills);
            const requirements = Array.isArray(apiJob.requirements)
              ? apiJob.requirements.map(String).map(s => s.trim()).filter(Boolean)
              : [];
            return {
              id: String(apiJob.id),
              title: apiJob.title || apiJob.jobTitle || "Untitled",
              company: apiJob.company || apiJob.companyName || "Unknown",
              location: apiJob.location || "Not specified",
              salary: apiJob.salary || "Not specified",
              salaryMin: 0,
              salaryMax: 0,
              experience: "Not specified",
              type: "Full-time" as const,
              remote: false,
              matchScore: apiJob.matchScore || breakdown.match_score || 0,
              postedAt: apiJob.postedDate || new Date().toISOString().split("T")[0],
              description: apiJob.description || "",
              skills: requirements.length > 0 ? requirements : [...matchingSkills, ...missingSkills],
              missingSkills,
              matchingSkills,
              benefits: [],
              recruiterName: "",
              recruiterTitle: "",
              recruiterEmail: "",
              applicants: 0,
              category: apiJob.platform || "Engineering",
              atsScore: Number(breakdown.ats_compatibility ?? apiJob.matchScore ?? 0),
              experienceMatch: breakdown.experience_match != null ? Number(breakdown.experience_match) : undefined,
              educationMatch: breakdown.education_match != null ? Number(breakdown.education_match) : undefined,
              keywordMatch: breakdown.keyword_match != null ? Number(breakdown.keyword_match) : undefined,
              recruiterRelevance: breakdown.recruiter_relevance != null ? Number(breakdown.recruiter_relevance) : undefined,
              autoApplyReason: breakdown.auto_apply_reason || undefined,
              profileImprovements: Array.isArray(breakdown.profile_improvements)
                ? breakdown.profile_improvements.map(String)
                : [],
              isEligible: apiJob.isEligible,
              matchAnalysis: apiJob.matchAnalysis || breakdown.match_analysis || "",
              saved: false,
            };
          });
          setJobs(transformedJobs);
          
          // Extract unique categories and job types from the data
          const uniqueCategories = ["All", ...new Set(transformedJobs.map((j: Job) => j.category))];
          const uniqueTypes = ["All Types", ...new Set(transformedJobs.map((j: Job) => j.type))];
          setDynamicCategories(uniqueCategories);
          setDynamicJobTypes(uniqueTypes);
          
          if (transformedJobs.length > 0) {
            setSelectedJob(transformedJobs[0]);
          }
        } else {
          setError(response.error || 'Failed to load jobs');
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job: Job) => {
    const matchesQuery = !query || job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.company.toLowerCase().includes(query.toLowerCase()) ||
      job.skills.some((s: string) => s.toLowerCase().includes(query.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || job.category === selectedCategory;
    const matchesType = selectedType === "All Types" || job.type === selectedType;
    const matchesSalary = job.salaryMin >= salaryRange[0] && job.salaryMax <= salaryRange[1];
    const matchesRemote = !remoteOnly || job.remote;
    return matchesQuery && matchesCategory && matchesType && matchesSalary && matchesRemote;
  });

  const toggleSave = (jobId: string) => {
    setJobs((prev: Job[]) => prev.map((j: Job) => j.id === jobId ? { ...j, saved: !j.saved } : j));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-muted-foreground mx-auto mb-3" size={32} />
          <p className="text-sm text-muted-foreground">Loading jobs...</p>
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
      {/* Search header */}
      <div className="px-6 py-4 border-b border-border bg-card/30 shrink-0 space-y-3">
        {/* AI Search bar */}
        <div className="relative">
          <Sparkles size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
          <Input
            placeholder="AI-powered job search: role, company, skills, or describe your ideal job..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-10 bg-muted/60 border-border pr-20 text-sm"
          />
          <Button size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 text-xs gap-1">
            <Brain size={11} /> AI Search
          </Button>
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "shrink-0 text-[11px] font-medium px-3 py-1 rounded-full border transition-all",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full border transition-all ml-auto",
              showFilters ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            <SlidersHorizontal size={11} /> Filters
          </button>
        </div>

        {/* Advanced filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 pb-1">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-8 text-xs bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicJobTypes.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="col-span-2">
                  <p className="text-[11px] text-muted-foreground mb-1">
                    Salary: ${(salaryRange[0] / 1000).toFixed(0)}K – ${(salaryRange[1] / 1000).toFixed(0)}K
                  </p>
                  <Slider
                    value={salaryRange}
                    onValueChange={setSalaryRange}
                    min={50000} max={400000} step={10000}
                    className="mt-1"
                  />
                </div>

                <button
                  onClick={() => setRemoteOnly(!remoteOnly)}
                  className={cn(
                    "h-8 rounded-md px-3 text-xs border transition-all",
                    remoteOnly ? "bg-primary/15 border-primary/40 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  Remote Only
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Job list */}
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 overflow-y-auto border-r border-border">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[12px] text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredJobs.length}</span> jobs found
              </span>
              <Select defaultValue="match">
                <SelectTrigger className="h-7 w-32 text-[11px] bg-transparent border-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match" className="text-xs">Best Match</SelectItem>
                  <SelectItem value="recent" className="text-xs">Most Recent</SelectItem>
                  <SelectItem value="salary" className="text-xs">Highest Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  selected={selectedJob?.id === job.id}
                  onSelect={() => setSelectedJob(job)}
                  onToggleSave={() => toggleSave(job.id)}
                />
              ))}
              {filteredJobs.length === 0 && (
                <div className="text-center py-12">
                  <Search size={32} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">No jobs found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job detail */}
        <div className="hidden lg:block flex-1 bg-background/50">
          {selectedJob ? (
            <JobDetailPanel job={selectedJob} onApply={() => onNavigate("automation")} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Briefcase size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Select a job to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
