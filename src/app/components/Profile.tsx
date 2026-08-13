import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, FileText, Award, Briefcase, GraduationCap, Code2,
  RefreshCw, Upload, Edit2, CheckCircle2,
  AlertCircle, Loader2, Sparkles, X, Database, Lightbulb,
  MapPin, Mail, Phone, AlertTriangle, Link2, Check, Star, Plus,
  Calendar, ExternalLink, TrendingUp, Download, Eye, Languages, Target
} from "lucide-react";
import { type UserProfile } from "./data";
import { cn } from "./ui/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner";
import { aiProfileService, type AIProfileSuggestion, type ProfileField, type DataSource } from "../../services/aiProfileService";
import { profileService } from "../../services/profileService";
import { resumeService } from "../../services/resumeService";

function computeDynamicScores(input: {
  skills: { gap?: boolean }[];
  experience: unknown[];
  education: unknown[];
  certifications: unknown[];
  projects: unknown[];
  resumeHistory: unknown[];
  summary?: string;
  phone?: string;
  location?: string;
  email?: string;
}): { resumeScore: number; atsScore: number; profileCompletion: number } {
  const ownedSkills = input.skills.filter(s => !s.gap).length;
  const gaps = input.skills.filter(s => s.gap).length;
  const hasResume = (input.resumeHistory?.length || 0) > 0;

  let resumeScore = 0;
  if (hasResume) resumeScore += 15;
  resumeScore += Math.min(25, ownedSkills * 3);
  resumeScore += Math.min(20, (input.experience?.length || 0) * 7);
  resumeScore += Math.min(12, (input.education?.length || 0) * 6);
  if (input.summary && input.summary.length > 20) resumeScore += Math.min(10, Math.max(4, Math.floor(input.summary.length / 40)));
  resumeScore += Math.min(8, (input.certifications?.length || 0) * 4);
  resumeScore += Math.min(4, (input.projects?.length || 0) * 2);
  if (input.phone && input.phone !== "Not provided") resumeScore += 3;
  if (input.location && input.location !== "Not provided") resumeScore += 3;
  resumeScore = Math.min(100, Math.max(0, resumeScore));

  let atsScore = 20;
  if (hasResume) atsScore += 15;
  atsScore += Math.min(30, ownedSkills * 4);
  if (input.email) atsScore += 5;
  if (input.phone && input.phone !== "Not provided") atsScore += 5;
  if (input.location && input.location !== "Not provided") atsScore += 5;
  if (input.summary && input.summary.length >= 80) atsScore += 8;
  atsScore += Math.min(10, (input.experience?.length || 0) * 4);
  atsScore += Math.min(6, (input.education?.length || 0) * 3);
  atsScore -= Math.min(15, gaps * 2);
  atsScore = Math.min(100, Math.max(0, atsScore));

  return {
    resumeScore,
    atsScore,
    profileCompletion: Math.min(100, Math.round((resumeScore + atsScore) / 2)),
  };
}

function getScoreImprovementTips(profile: UserProfile & { languages?: string[] }): {
  resumeTips: { tip: string; impact: string; action?: string }[];
  atsTips: { tip: string; impact: string; action?: string }[];
} {
  const ownedSkills = profile.skills.filter(s => !s.gap).length;
  const gaps = profile.skills.filter(s => s.gap);
  const hasResume = profile.resumeHistory.length > 0;
  const summaryLen = (profile.summary || "").trim().length;

  const resumeTips: { tip: string; impact: string; action?: string }[] = [];
  const atsTips: { tip: string; impact: string; action?: string }[] = [];

  if (!hasResume) {
    resumeTips.push({ tip: "Upload your latest PDF resume", impact: "+15 Resume / +15 ATS", action: "resume" });
    atsTips.push({ tip: "ATS parsers need a PDF resume on file", impact: "+15 ATS", action: "resume" });
  }
  if (ownedSkills < 8) {
    resumeTips.push({ tip: `Add more technical skills (you have ${ownedSkills}; aim for 8–12)`, impact: "up to +25 Resume", action: "skills" });
    atsTips.push({ tip: "Include keyword-rich skills matching Backend Developer roles (Spring Boot, Java, REST, SQL, Microservices)", impact: "up to +30 ATS", action: "skills" });
  }
  if (profile.experience.length < 2) {
    resumeTips.push({ tip: "Add full work experience with company, role, dates, and impact bullets", impact: "up to +20 Resume", action: "experience" });
    atsTips.push({ tip: "List 2+ experience entries with measurable achievements", impact: "up to +10 ATS", action: "experience" });
  }
  if (profile.education.length === 0) {
    resumeTips.push({ tip: "Add education (degree, college, year)", impact: "up to +12 Resume", action: "education" });
    atsTips.push({ tip: "Education section helps ATS parse your qualification", impact: "up to +6 ATS", action: "education" });
  }
  if (summaryLen < 80) {
    resumeTips.push({ tip: "Write a 3–5 line professional summary tailored to Backend Developer", impact: "up to +10 Resume", action: "overview" });
    atsTips.push({ tip: "Summary should be 80+ characters with role keywords (Java, APIs, databases)", impact: "+8 ATS", action: "overview" });
  }
  if (profile.certifications.length === 0) {
    resumeTips.push({ tip: "Add certifications (AWS, Oracle Java, Spring Professional, etc.)", impact: "up to +8 Resume", action: "certifications" });
  }
  if (profile.projects.length === 0) {
    resumeTips.push({ tip: "Add 2–3 projects with tech stack and outcomes", impact: "up to +4 Resume", action: "projects" });
  }
  if (!profile.languages || profile.languages.length === 0) {
    resumeTips.push({ tip: "Add languages you speak", impact: "+3 Resume", action: "overview" });
  }
  if (gaps.length > 0) {
    atsTips.push({
      tip: `Learn or list trending skills: ${gaps.slice(0, 4).map(g => g.name).join(", ")}`,
      impact: "reduces gap penalty",
      action: "skills",
    });
  }
  if (profile.phone === "Not provided" || !profile.phone) {
    atsTips.push({ tip: "Ensure phone number is present for ATS contact parsing", impact: "+5 ATS" });
  }

  if (resumeTips.length < 3) {
    resumeTips.push({ tip: "Quantify achievements (e.g. “reduced API latency by 40%”)", impact: "stronger resume quality" });
  }
  if (atsTips.length < 3) {
    atsTips.push({ tip: "Use a clean single-column PDF; avoid tables/images for ATS", impact: "better parse rate" });
    atsTips.push({ tip: "Mirror job-description keywords in skills and summary", impact: "higher match score" });
  }

  return { resumeTips: resumeTips.slice(0, 5), atsTips: atsTips.slice(0, 5) };
}

function mapApiProfileToUi(payload: any): UserProfile & { languages?: string[] } {
  // apiService wraps the JSON body; support both {user,...} and nested {data:{user,...}}
  const root = payload?.user ? payload : (payload?.data?.user ? payload.data : payload);
  const apiUser = root?.user || root || {};
  const first = apiUser.firstName || "";
  const last = apiUser.lastName || "";
  const name = apiUser.name || apiUser.fullName || `${first} ${last}`.trim() || "User";
  const avatar = `${(first || name || "U")[0]}${(last || name.split(" ")[1] || "U")[0] || "U"}`.toUpperCase();

  const skillsSource = Array.isArray(root?.skills) ? root.skills
    : Array.isArray(payload?.skills) ? payload.skills : [];

  let skills = skillsSource.map((s: any) => ({
        name: s.name || s.skillName || "",
        level: (String(s.level || "intermediate").toLowerCase() as UserProfile["skills"][0]["level"]),
        yearsOfExp: s.yearsOfExp ?? s.yearsOfExperience ?? 0,
        trending: !!s.trending,
        gap: !!s.gap,
      })).filter((s: any) => s.name);

  // Fallback: parse skillsString when skills table is empty
  if (skills.length === 0 && apiUser.skillsString) {
    skills = String(apiUser.skillsString).split(/[,;|/]+/).map((n: string) => n.trim()).filter(Boolean).map((name: string) => ({
      name,
      level: "intermediate" as const,
      yearsOfExp: 0,
      trending: false,
      gap: false,
    }));
  }

  const experienceSource = Array.isArray(root?.experience) ? root.experience
    : Array.isArray(payload?.experience) ? payload.experience : [];
  const experience = experienceSource.map((e: any) => ({
        id: String(e.id ?? crypto.randomUUID()),
        role: e.role || e.jobTitle || "",
        company: e.company || e.companyName || "",
        location: e.location || "",
        startDate: e.startDate || "",
        endDate: e.endDate ?? null,
        current: !!e.current || !!e.isCurrent,
        description: e.description || "",
        skills: Array.isArray(e.skills) ? e.skills : [],
      }));

  const educationSource = Array.isArray(root?.education) ? root.education
    : Array.isArray(payload?.education) ? payload.education : [];
  const education = educationSource.map((e: any) => ({
        id: String(e.id ?? crypto.randomUUID()),
        degree: e.degree || "",
        institution: e.institution || e.institutionName || "",
        field: e.field || e.fieldOfStudy || "",
        startYear: e.startYear ?? null,
        endYear: e.endYear ?? null,
        gpa: e.gpa || e.grade,
      }));

  const certificationsSource = Array.isArray(root?.certifications) ? root.certifications
    : Array.isArray(payload?.certifications) ? payload.certifications : [];
  const certifications = certificationsSource.map((c: any) => ({
        id: String(c.id ?? crypto.randomUUID()),
        name: c.name || c.certificationName || "",
        issuer: c.issuer || c.issuingOrganization || "",
        issueDate: c.issueDate || "",
        expiryDate: c.expiryDate || c.expirationDate,
        credentialId: c.credentialId || "",
      }));

  const projectsSource = Array.isArray(root?.projects) ? root.projects
    : Array.isArray(payload?.projects) ? payload.projects : [];
  const projects = projectsSource.map((p: any) => ({
        id: String(p.id ?? crypto.randomUUID()),
        name: p.name || "Project",
        description: p.description || "",
        technologies: Array.isArray(p.technologies) ? p.technologies : [],
        url: p.url,
        startDate: p.startDate || "",
        endDate: p.endDate,
      }));

  const resumeHistorySource = Array.isArray(root?.resumeHistory) ? root.resumeHistory
    : Array.isArray(payload?.resumeHistory) ? payload.resumeHistory : [];
  const resumeHistory = resumeHistorySource.map((h: any) => ({
        version: h.version || h.filename || "Resume",
        uploadedAt: h.uploadedAt || h.uploadTimestamp || "",
        score: typeof h.score === "number" ? h.score : 0,
      }));

  const languagesSource = Array.isArray(root?.languages) ? root.languages
    : Array.isArray(payload?.languages) ? payload.languages : [];

  const summary = apiUser.summary || "";
  const phone = apiUser.phone || "Not provided";
  const location = apiUser.location || apiUser.city || "Not provided";
  const email = apiUser.email || "";

  const computed = computeDynamicScores({
    skills, experience, education, certifications, projects, resumeHistory, summary, phone, location, email,
  });

  const resumeScore = Number(apiUser.resumeScore) > 0 ? Number(apiUser.resumeScore) : computed.resumeScore;
  const atsScore = Number(apiUser.atsScore) > 0 ? Number(apiUser.atsScore) : computed.atsScore;
  const profileCompletion = Number(apiUser.profileCompletion || apiUser.profileScore) > 0
    ? Number(apiUser.profileCompletion || apiUser.profileScore)
    : computed.profileCompletion;

  return {
    id: String(apiUser.id || "1"),
    name,
    email,
    phone,
    location,
    headline: apiUser.headline || apiUser.currentDesignation || apiUser.preferredJobRole || "Professional",
    summary,
    avatar,
    resumeScore,
    atsScore,
    profileCompletion,
    skills,
    experience,
    education,
    certifications,
    projects,
    resumeHistory: resumeHistory.map((h, i) => i === 0 ? { ...h, score: resumeScore } : h),
    linkedInConnected: !!apiUser.linkedInConnected || !!apiUser.linkedInEmail,
    naukriConnected: !!apiUser.naukriConnected || !!apiUser.naukriEmail,
    languages: languagesSource,
  } as UserProfile & { languages?: string[] };
}

function ScoreRing({ score, label, color, description }: {
  score: number; label: string; color: string; description?: string;
}) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-border" />
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="7" stroke={color} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1.2s ease-in-out" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{score}</span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[12px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

const skillLevelConfig = {
  beginner: { label: "Beginner", color: "text-chart-4", bg: "bg-chart-4/15", barClass: "bg-chart-4", width: 25 },
  intermediate: { label: "Intermediate", color: "text-chart-2", bg: "bg-chart-2/15", barClass: "bg-chart-2", width: 55 },
  advanced: { label: "Advanced", color: "text-chart-1", bg: "bg-chart-1/15", barClass: "bg-chart-1", width: 78 },
  expert: { label: "Expert", color: "text-chart-3", bg: "bg-chart-3/15", barClass: "bg-chart-3", width: 95 },
};

export function Profile() {
  const [profile, setProfile] = useState<(UserProfile & { languages?: string[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // AI Profile Auto-Fill states
  const [autoFilling, setAutoFilling] = useState(false);
  const [profileFields, setProfileFields] = useState<Record<string, ProfileField>>({});
  const [aiSuggestions, setAiSuggestions] = useState<AIProfileSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [sourceStatus, setSourceStatus] = useState<Record<string, { available: boolean; lastSynced?: string; error?: string }>>({});
  const [completenessScore, setCompletenessScore] = useState<number>(0);
  const [resumeSyncDiffs, setResumeSyncDiffs] = useState<any[]>([]);
  const [showResumeSyncDialog, setShowResumeSyncDialog] = useState(false);
  const [syncingResume, setSyncingResume] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showResumePreview, setShowResumePreview] = useState(false);

  const reloadProfile = async () => {
    const response = await profileService.getUserProfile();
    if (response.success && response.data) {
      const mapped = mapApiProfileToUi(response.data);
      setProfile(mapped);
      setCompletenessScore(mapped.profileCompletion);
      return mapped;
    }
    throw new Error(response.error || "Failed to load profile");
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF resume");
      return;
    }

    setSyncingResume(true);
    try {
      const uploadResponse = await resumeService.uploadResume(file);
      // apiService wraps body — support both shapes
      const uploadBody: any = uploadResponse.data || {};
      const ok = uploadResponse.success || uploadBody.success;
      if (!ok) {
        toast.error(uploadResponse.error || uploadBody.error || "Failed to upload resume");
        return;
      }

      const resumeId = uploadBody.resumeId ?? uploadBody.uploadHistory?.id;
      const parsedData = uploadBody.parsedData;
      const parseWarning = uploadBody.parseWarning;

      // If upload saved the file but AI parse didn't run, trigger parse explicitly
      if (resumeId && !parsedData) {
        try {
          toast.message("Extracting profile from resume…");
          await resumeService.parseResume(resumeId);
        } catch {
          toast.error("Resume saved, but AI extraction failed. Check AI API keys.");
        }
      }

      if (resumeId) {
        try {
          const syncResponse = await aiProfileService.syncWithResume(resumeId);
          if (syncResponse.success && syncResponse.data) {
            setResumeSyncDiffs(syncResponse.data.diffs || []);
            if (syncResponse.data.suggestions?.length) {
              setAiSuggestions((prev) => [...prev, ...syncResponse.data!.suggestions]);
              setShowSuggestions(true);
            }
            if (syncResponse.data.requiresConfirmation && (syncResponse.data.diffs?.length || 0) > 0) {
              setShowResumeSyncDialog(true);
            }
          }
        } catch {
          // Sync is optional after successful upload + parse
        }
      }

      // Reload full profile (skills/experience/scores) then AI merge auto-fill
      const mapped = await reloadProfile();
      await triggerAutoFill();
      // Reload again so merge-applied fields are reflected
      await reloadProfile();

      const scoreMsg = mapped
        ? ` Resume ${mapped.resumeScore}/100 · ATS ${mapped.atsScore}/100`
        : "";
      toast.success(
        parseWarning
          ? `Resume uploaded with parse warnings.${scoreMsg}`
          : `Profile auto-filled from resume.${scoreMsg}`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload and sync resume");
    } finally {
      setSyncingResume(false);
    }
  };

  const handleDownloadResume = async () => {
    try {
      await resumeService.downloadLatestResume();
      toast.success("Resume download started");
    } catch {
      toast.error("No resume available to download");
    }
  };

  const handlePreviewResume = async () => {
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = await resumeService.getPreviewObjectUrl();
      setPreviewUrl(url);
      setShowResumePreview(true);
    } catch {
      toast.error("No resume available to preview");
    }
  };

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        await reloadProfile();
        await triggerAutoFill();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const triggerAutoFill = async () => {
    try {
      setAutoFilling(true);
      const response = await aiProfileService.mergeProfileData();
      if (response.success && response.data) {
        const mergedData = response.data.mergedData ?? {};
        const suggestions = response.data.suggestions ?? [];
        const sources = response.data.sources ?? [];

        // Convert ProfileData to Record<string, ProfileField>
        const fieldsAsRecord: Record<string, ProfileField> = {};
        Object.entries(mergedData).forEach(([key, value]) => {
          fieldsAsRecord[key] = value as ProfileField;
        });
        setProfileFields(fieldsAsRecord);
        setAiSuggestions(suggestions);
        setSourceStatus(
          sources.reduce((acc, source) => {
            acc[source.source] = {
              available: source.available,
              lastSynced: source.lastSynced,
              error: source.error,
            };
            return acc;
          }, {} as Record<string, { available: boolean; lastSynced?: string; error?: string }>)
        );

        // Immediately reflect merged scalar fields on the visible profile card
        const fieldVal = (key: string) => {
          const f = fieldsAsRecord[key];
          if (!f) return undefined;
          const v = (f as any).value ?? f;
          return typeof v === "string" ? v : undefined;
        };
        setProfile((prev) => {
          if (!prev) return prev;
          const nextSummary = fieldVal("summary") || fieldVal("aboutMe") || prev.summary;
          const nextHeadline = fieldVal("headline") || fieldVal("currentDesignation") || fieldVal("preferredJobRole") || prev.headline;
          const nextName = fieldVal("fullName") || fieldVal("name") || prev.name;
          const nextPhone = fieldVal("phone") || fieldVal("mobile") || prev.phone;
          const nextLocation = fieldVal("city") || fieldVal("location") || fieldVal("currentCity") || prev.location;
          const nextSkillsRaw = fieldsAsRecord.skills?.value ?? fieldsAsRecord.keySkills?.value;
          let nextSkills = prev.skills;
          if (Array.isArray(nextSkillsRaw) && nextSkillsRaw.length > 0) {
            const existingGaps = prev.skills.filter(s => s.gap);
            nextSkills = [
              ...nextSkillsRaw.map((s: any) => ({
                name: typeof s === "string" ? s : (s.name || s.skillName || ""),
                level: "intermediate" as const,
                yearsOfExp: 0,
                trending: false,
                gap: false,
              })).filter((s: any) => s.name),
              ...existingGaps,
            ];
          }
          const recomputed = computeDynamicScores({
            skills: nextSkills,
            experience: prev.experience,
            education: prev.education,
            certifications: prev.certifications,
            projects: prev.projects,
            resumeHistory: prev.resumeHistory,
            summary: nextSummary,
            phone: nextPhone,
            location: nextLocation,
            email: prev.email,
          });
          return {
            ...prev,
            name: nextName || prev.name,
            headline: nextHeadline || prev.headline,
            summary: nextSummary || prev.summary,
            phone: nextPhone || prev.phone,
            location: nextLocation || prev.location,
            skills: nextSkills,
            resumeScore: Math.max(prev.resumeScore, recomputed.resumeScore),
            atsScore: Math.max(prev.atsScore, recomputed.atsScore),
            profileCompletion: Math.max(prev.profileCompletion, recomputed.profileCompletion),
          };
        });
        
        if (suggestions.length > 0) {
          setShowSuggestions(true);
        }
        
        // Auto-save if confidence is high enough
        if ((response.data.overallConfidence ?? 0) >= 80 && Object.keys(fieldsAsRecord).length > 0) {
          await autoSaveProfile(fieldsAsRecord);
        }
      }
    } catch (err) {
      console.error('Auto-fill failed:', err);
      toast.error('Auto-fill failed, using existing data');
    } finally {
      setAutoFilling(false);
    }
  };

  const autoSaveProfile = async (fields: Record<string, ProfileField>) => {
    try {
      setAutoSaving(true);
      const response = await aiProfileService.autoSaveProfile(fields);
      if (response.success) {
        toast.success('Profile auto-saved successfully');
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setAutoSaving(false);
    }
  };

  const [fieldValidation, setFieldValidation] = useState<Record<string, { valid: boolean; issues: string[]; suggestions: string[] }>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingField, setPendingField] = useState<{ field: string; value: any; confidence: number } | null>(null);

  const validateField = async (field: string, value: any) => {
    try {
      const response = await aiProfileService.validateField(field, value);
      setFieldValidation(prev => ({
        ...prev,
        [field]: {
          valid: response.data.valid,
          issues: response.data.issues || [],
          suggestions: response.data.suggestions || [],
        },
      }));
      return response.data;
    } catch (err) {
      return { valid: false, issues: ['Validation failed'], suggestions: [] };
    }
  };

  const handleFieldChange = async (field: string, value: any) => {
    const currentField = profileFields[field];
    const confidence = currentField?.confidence || 80;
    
    // Check if confidence is low and requires confirmation
    if (confidence < 70) {
      setPendingField({ field, value, confidence });
      setShowConfirmation(true);
      return;
    }
    
    // Real-time validation
    await validateField(field, value);
    
    setProfileFields(prev => ({
      ...prev,
      [field]: {
        value,
        source: 'manual',
        confidence: 100,
        lastUpdated: new Date().toISOString(),
      },
    }));
    
    // Trigger auto-save
    autoSaveProfile();
  };

  const confirmFieldUpdate = () => {
    if (pendingField) {
      setProfileFields(prev => ({
        ...prev,
        [pendingField.field]: {
          value: pendingField.value,
          source: 'manual',
          confidence: pendingField.confidence,
          lastUpdated: new Date().toISOString(),
        },
      }));
      setShowConfirmation(false);
      setPendingField(null);
      autoSaveProfile();
      toast.success('Field updated with low confidence');
    }
  };

  const cancelFieldUpdate = () => {
    setShowConfirmation(false);
    setPendingField(null);
  };

  const applySuggestion = async (suggestion: AIProfileSuggestion) => {
    try {
      const response = await aiProfileService.applySuggestions([suggestion]);
      if (response.success) {
        setAiSuggestions(prev => prev.filter(s => s.field !== suggestion.field));
        setProfileFields(prev => ({
          ...prev,
          [suggestion.field]: {
            value: suggestion.suggestedValue,
            source: 'ai',
            confidence: suggestion.confidence,
            lastUpdated: new Date().toISOString(),
          },
        }));
        toast.success('Suggestion applied');
      }
    } catch (err) {
      toast.error('Failed to apply suggestion');
    }
  };

  const acceptAllSuggestions = async () => {
    try {
      const response = await aiProfileService.applySuggestions(aiSuggestions);
      if (response.success) {
        aiSuggestions.forEach(suggestion => {
          setProfileFields(prev => ({
            ...prev,
            [suggestion.field]: {
              value: suggestion.suggestedValue,
              source: 'ai',
              confidence: suggestion.confidence,
              lastUpdated: new Date().toISOString(),
            },
          }));
        });
        setAiSuggestions([]);
        setShowSuggestions(false);
        toast.success('All suggestions applied');
      }
    } catch (err) {
      toast.error('Failed to apply suggestions');
    }
  };

  const getSourceIcon = (source: DataSource) => {
    switch (source) {
      case 'resume': return <FileText size={12} />;
      case 'naukri': return <Briefcase size={12} />;
      case 'linkedin': return <Link2 size={12} />;
      case 'manual': return <Edit2 size={12} />;
      case 'ai': return <Sparkles size={12} />;
      default: return <Database size={12} />;
    }
  };

  const getSourceColor = (source: DataSource) => {
    switch (source) {
      case 'resume': return 'text-chart-1';
      case 'naukri': return 'text-orange-500';
      case 'linkedin': return 'text-blue-500';
      case 'manual': return 'text-green-500';
      case 'ai': return 'text-purple-500';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-muted-foreground mx-auto mb-3" size={32} />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-destructive mx-auto mb-3" size={32} />
          <p className="text-sm text-muted-foreground">{error || 'No profile data available'}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-[1100px] mx-auto space-y-6">

        {/* AI Suggestions Banner */}
        <AnimatePresence>
          {showSuggestions && aiSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-purple-500/20 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="text-purple-500" size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-foreground mb-1">AI Profile Suggestions</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    {aiSuggestions.length} improvement suggestions available to enhance your profile
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs gap-1.5" onClick={acceptAllSuggestions}>
                      <Check size={12} /> Accept All
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowSuggestions(false)}>
                      <X size={12} /> Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confidence Confirmation Dialog */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-yellow-500" size={18} />
                Low Confidence Field Update
              </DialogTitle>
              <DialogDescription>
                This field has a confidence score of {pendingField?.confidence}%. Are you sure you want to update it?
              </DialogDescription>
            </DialogHeader>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-700 mb-1">Field: {pendingField?.field || ''}</p>
              <p className="text-xs text-yellow-700">New Value: {pendingField ? (typeof pendingField.value === 'string' ? pendingField.value : JSON.stringify(pendingField.value)) : ''}</p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={cancelFieldUpdate}>
                Cancel
              </Button>
              <Button onClick={confirmFieldUpdate}>
                Confirm Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Auto-Fill Status */}
        {autoFilling && (
          <Card className="border-border bg-muted/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={16} />
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">Auto-filling profile from sources...</p>
                <p className="text-[10px] text-muted-foreground">Retrieving data from Resume, LinkedIn, and Naukri</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto-Save Status */}
        {autoSaving && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Loader2 className="animate-spin" size={12} />
            <span>Auto-saving profile changes...</span>
          </div>
        )}

        {/* Source Status */}
        {Object.keys(sourceStatus).length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database size={14} />
                Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(sourceStatus).map(([source, status]) => (
                  <Badge key={source} variant={status.available ? "default" : "destructive"} className="text-[10px] gap-1">
                    {getSourceIcon(source as DataSource)}
                    {source.charAt(0).toUpperCase() + source.slice(1)}
                    {status.available ? (
                      <CheckCircle2 size={10} />
                    ) : (
                      <AlertCircle size={10} />
                    )}
                  </Badge>
                ))}
              </div>
              
              {/* Error warnings for failed sources */}
              {Object.entries(sourceStatus).filter(([_, status]) => !status.available).length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-destructive mb-1">Source Unavailable</p>
                      <p className="text-[10px] text-muted-foreground mb-2">
                        {Object.entries(sourceStatus).filter(([_, status]) => !status.available).map(([source, _]) => source).join(', ')} 
                        could not be accessed. Profile data from available sources has been loaded.
                      </p>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => triggerAutoFill()}>
                        <RefreshCw size={10} /> Retry
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Profile Header */}
        <Card className="border-border overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-5 flex-wrap">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-foreground">{profile.avatar}</span>
                </div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
                  <Edit2 size={10} className="text-muted-foreground" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-foreground">{profile.name}</h2>
                      {profileFields.fullName && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          {getSourceIcon(profileFields.fullName.source)}
                          <span className={getSourceColor(profileFields.fullName.source)}>{profileFields.fullName.source}</span>
                          {profileFields.fullName.confidence}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{profile.headline}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {profile.location}</span>
                      <span className="flex items-center gap-1"><Mail size={10} /> {profile.email}</span>
                      <span className="flex items-center gap-1"><Phone size={10} /> {profile.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => triggerAutoFill()} disabled={autoFilling}>
                      {autoFilling ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      Auto-Fill
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handlePreviewResume}>
                      <Eye size={12} /> Preview
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleDownloadResume}>
                      <Download size={12} /> Download
                    </Button>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeUpload}
                      className="hidden"
                      id="resume-upload"
                    />
                    <Button size="sm" className="h-8 text-xs gap-1.5" disabled={syncingResume} onClick={() => document.getElementById('resume-upload')?.click()}>
                      {syncingResume ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      Upload Resume
                    </Button>
                  </div>
                </div>

                {/* Platform connections */}
                <div className="flex items-center gap-3 mt-3">
                  <div className={cn(
                    "flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border",
                    profile.linkedInConnected
                      ? "border-chart-3/30 text-chart-3 bg-chart-3/10"
                      : "border-border text-muted-foreground"
                  )}>
                    <Link2 size={10} />
                    LinkedIn {profile.linkedInConnected ? "Connected" : "Not Connected"}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border cursor-pointer hover:border-primary/40 transition-colors",
                    profile.naukriConnected
                      ? "border-chart-3/30 text-chart-3 bg-chart-3/10"
                      : "border-border text-muted-foreground"
                  )}>
                    <Link2 size={10} />
                    Naukri {profile.naukriConnected ? "Connected" : "Connect"}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile completion */}
            <div className="mt-5 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-foreground">Profile Completion</span>
                <span className="text-[12px] font-bold text-chart-3">{profile.profileCompletion}%</span>
              </div>
              <Progress value={profile.profileCompletion} className="h-2" />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {profile.resumeHistory.length === 0
                  ? "Upload a PDF resume to boost completion and scores."
                  : profile.skills.filter(s => !s.gap).length < 8
                    ? "Add more skills, experience, and projects to reach 100%."
                    : profile.projects.length === 0
                      ? "Add portfolio links and projects to reach 100%."
                      : "Keep experience and certifications updated to stay at 100%."}
              </p>
            </div>
          </div>
        </Card>

        {/* Score cards */}
        {(() => {
          const { resumeTips, atsTips } = getScoreImprovementTips(profile);
          return (
            <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="p-5 flex items-center justify-center">
              <ScoreRing
                score={profile.resumeScore}
                label="Resume Score"
                color="var(--color-chart-1)"
                description={profile.resumeScore >= 85 ? "Strong" : profile.resumeScore >= 60 ? "Good" : "Needs work"}
              />
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-5 flex items-center justify-center">
              <ScoreRing
                score={profile.atsScore}
                label="ATS Score"
                color="var(--color-chart-3)"
                description={profile.atsScore >= 85 ? "Strong" : profile.atsScore >= 60 ? "Good" : "Needs work"}
              />
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Skill Gap Analysis</h4>
              {profile.skills.filter(s => s.gap).length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  {profile.skills.length === 0
                    ? "Upload a resume to extract skills and detect market gaps."
                    : "No skill gaps flagged for your field right now."}
                </p>
              ) : (
                profile.skills.filter(s => s.gap).slice(0, 6).map((skill) => (
                  <div key={skill.name} className="flex items-center gap-2">
                    <AlertCircle size={12} className="text-chart-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[11px] gap-2">
                        <span className="text-foreground font-medium truncate">{skill.name}</span>
                        <span className="text-chart-4 shrink-0">Missing</span>
                      </div>
                      {skill.trending && (
                        <p className="text-[10px] text-muted-foreground">Trending in your job market</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* How to improve scores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb size={14} className="text-chart-1" />
                Improve Resume Score ({profile.resumeScore}/100)
              </CardTitle>
              <CardDescription className="text-xs">
                Based on what is missing from your profile right now
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 space-y-2">
              {resumeTips.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => item.action && setActiveTab(item.action)}
                  className="w-full text-left flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors"
                >
                  <span className="text-[10px] font-bold text-chart-1 mt-0.5 shrink-0">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-foreground">{item.tip}</p>
                    <p className="text-[10px] text-chart-3 mt-0.5">{item.impact}</p>
                  </div>
                </button>
              ))}
              {profile.resumeHistory.length === 0 && (
                <Button size="sm" className="w-full h-8 text-xs gap-1.5 mt-1" onClick={() => document.getElementById('resume-upload')?.click()}>
                  <Upload size={12} /> Upload Resume Now
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target size={14} className="text-chart-3" />
                Improve ATS Score ({profile.atsScore}/100)
              </CardTitle>
              <CardDescription className="text-xs">
                Make your resume easier for applicant tracking systems to parse
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 space-y-2">
              {atsTips.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => item.action && setActiveTab(item.action)}
                  className="w-full text-left flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors"
                >
                  <span className="text-[10px] font-bold text-chart-3 mt-0.5 shrink-0">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-foreground">{item.tip}</p>
                    <p className="text-[10px] text-chart-3 mt-0.5">{item.impact}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
            </>
          );
        })()}

        {/* AI Suggestions Panel */}
        {showSuggestions && aiSuggestions.length > 0 && (
          <Card className="border-border bg-gradient-to-br from-purple-500/5 to-blue-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="text-yellow-500" size={16} />
                AI Suggestions
              </CardTitle>
              <CardDescription className="text-xs">
                {aiSuggestions.length} suggestions to improve your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 rounded-lg bg-card border border-border"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="text-purple-500" size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground capitalize">{suggestion.field}</span>
                        <Badge variant="outline" className="text-[9px] h-4">
                          {suggestion.category}
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] h-4">
                          {suggestion.confidence}%
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2">{suggestion.reason}</p>
                      <div className="bg-muted/50 rounded p-2 mb-2">
                        <p className="text-[10px] text-muted-foreground mb-1">Current:</p>
                        <p className="text-[11px] text-foreground line-through opacity-60">
                          {typeof suggestion.currentValue === 'string' 
                            ? suggestion.currentValue 
                            : JSON.stringify(suggestion.currentValue)}
                        </p>
                      </div>
                      <div className="bg-green-500/10 rounded p-2 border border-green-500/20">
                        <p className="text-[10px] text-green-600 mb-1">Suggested:</p>
                        <p className="text-[11px] text-foreground">
                          {typeof suggestion.suggestedValue === 'string' 
                            ? suggestion.suggestedValue 
                            : JSON.stringify(suggestion.suggestedValue)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => applySuggestion(suggestion)}>
                        <Check size={14} className="text-green-500" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setAiSuggestions(prev => prev.filter((_, i) => i !== index))}>
                        <X size={14} className="text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Resume Sync Dialog */}
        <AnimatePresence>
          {showResumeSyncDialog && resumeSyncDiffs.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card rounded-lg border border-border max-w-lg w-full p-6"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <FileText className="text-blue-500" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground mb-1">Resume Changes Detected</h3>
                    <p className="text-xs text-muted-foreground">
                      {resumeSyncDiffs.length} field(s) have changed compared to your current profile
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowResumeSyncDialog(false)}>
                    <X size={14} />
                  </Button>
                </div>

                <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                  {resumeSyncDiffs.map((diff, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-foreground capitalize">{diff.field}</span>
                        <Badge variant="outline" className="text-[9px] h-4">
                          {diff.source}
                        </Badge>
                      </div>
                      <div className="text-[10px]">
                        <p className="text-muted-foreground mb-1">Old: <span className="line-through opacity-60">{diff.oldValue}</span></p>
                        <p className="text-green-600">New: {diff.newValue}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowResumeSyncDialog(false)}>
                    Ignore Changes
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => {
                    // Apply all diffs
                    resumeSyncDiffs.forEach(diff => {
                      setProfileFields(prev => ({
                        ...prev,
                        [diff.field]: {
                          value: diff.newValue,
                          source: diff.source,
                          confidence: 95,
                          lastUpdated: new Date().toISOString(),
                        },
                      }));
                    });
                    setShowResumeSyncDialog(false);
                    toast.success('Resume changes applied');
                  }}>
                    Apply Changes
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 w-full justify-start overflow-x-auto h-9">
            <TabsTrigger value="overview" className="text-xs"><User size={12} className="mr-1.5" />Overview</TabsTrigger>
            <TabsTrigger value="skills" className="text-xs"><Star size={12} className="mr-1.5" />Skills</TabsTrigger>
            <TabsTrigger value="experience" className="text-xs"><Briefcase size={12} className="mr-1.5" />Experience</TabsTrigger>
            <TabsTrigger value="education" className="text-xs"><GraduationCap size={12} className="mr-1.5" />Education</TabsTrigger>
            <TabsTrigger value="certifications" className="text-xs"><Award size={12} className="mr-1.5" />Certifications</TabsTrigger>
            <TabsTrigger value="projects" className="text-xs"><Code2 size={12} className="mr-1.5" />Projects</TabsTrigger>
            <TabsTrigger value="resume" className="text-xs"><FileText size={12} className="mr-1.5" />Resume History</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Professional Summary</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {profile.summary ? (
                  <p className="text-[13px] text-foreground leading-relaxed">{profile.summary}</p>
                ) : (
                  <p className="text-[13px] text-muted-foreground">No summary yet. Upload a resume or use Auto-Fill to populate this section.</p>
                )}
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Languages size={14} /> Languages</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  {(profile.languages?.length ?? 0) === 0 ? (
                    <p className="text-xs text-muted-foreground">No languages on file.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.languages!.map((lang) => (
                        <Badge key={lang} variant="secondary" className="text-[10px]">{lang}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 space-y-2 text-[12px] text-muted-foreground">
                  <p className="flex items-center gap-2"><Mail size={12} /> {profile.email || "—"}</p>
                  <p className="flex items-center gap-2"><Phone size={12} /> {profile.phone || "—"}</p>
                  <p className="flex items-center gap-2"><MapPin size={12} /> {profile.location || "—"}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Skills */}
          <TabsContent value="skills" className="mt-4">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Skills</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-3">
                {profile.skills.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No skills found. Upload a resume to extract skills automatically.</p>
                ) : profile.skills.map((skill) => {
                  const cfg = skillLevelConfig[skill.level] || skillLevelConfig.intermediate;
                  return (
                    <div key={skill.name} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 w-32 shrink-0">
                        <span className="text-[13px] font-medium text-foreground">{skill.name}</span>
                        {skill.trending && <TrendingUp size={10} className="text-chart-3" />}
                        {skill.gap && <AlertCircle size={10} className="text-chart-4" />}
                      </div>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", cfg.barClass)}
                          style={{ width: `${cfg.width}%` }}
                        />
                      </div>
                      <span className={cn("text-[10px] font-medium w-20 text-right shrink-0 px-1.5 py-0.5 rounded", cfg.color, cfg.bg)}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground w-16 text-right shrink-0">{skill.yearsOfExp}y exp</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experience */}
          <TabsContent value="experience" className="mt-4 space-y-4">
            {profile.experience.length === 0 ? (
              <Card className="border-border"><CardContent className="p-5 text-xs text-muted-foreground">No experience entries yet. Upload a resume to populate this section.</CardContent></Card>
            ) : profile.experience.map((exp) => (
              <Card key={exp.id} className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Briefcase size={14} className="text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold text-foreground">{exp.role}</h4>
                      <p className="text-[12px] text-muted-foreground">{exp.company}{exp.location ? ` • ${exp.location}` : ""}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {exp.startDate} – {exp.current ? "Present" : exp.endDate || "—"}
                        {exp.current && <Badge variant="secondary" className="ml-2 text-[9px] h-4">Current</Badge>}
                      </p>
                      {exp.description && <p className="text-[12px] text-foreground mt-2 leading-relaxed">{exp.description}</p>}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(exp.skills || []).map(s => (
                          <Badge key={s} variant="secondary" className="text-[10px] h-5 px-1.5">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Education */}
          <TabsContent value="education" className="mt-4 space-y-4">
            {profile.education.length === 0 ? (
              <Card className="border-border"><CardContent className="p-5 text-xs text-muted-foreground">No education entries yet.</CardContent></Card>
            ) : profile.education.map((edu) => (
              <Card key={edu.id} className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <GraduationCap size={14} className="text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold text-foreground">{edu.degree}</h4>
                      <p className="text-[12px] text-muted-foreground">{edu.institution}{edu.field ? ` • ${edu.field}` : ""}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{edu.startYear || "—"} – {edu.endYear || "Present"}</p>
                      {edu.gpa && <p className="text-[11px] text-chart-3 mt-0.5">Grade: {edu.gpa}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Certifications */}
          <TabsContent value="certifications" className="mt-4 space-y-4">
            {profile.certifications.length === 0 ? (
              <Card className="border-border"><CardContent className="p-5 text-xs text-muted-foreground">No certifications yet.</CardContent></Card>
            ) : profile.certifications.map((cert) => (
              <Card key={cert.id} className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-chart-4/15 flex items-center justify-center shrink-0">
                      <Award size={14} className="text-chart-4" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold text-foreground">{cert.name}</h4>
                      <p className="text-[12px] text-muted-foreground">{cert.issuer}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        {cert.issueDate && <span className="flex items-center gap-1"><Calendar size={9} /> Issued {cert.issueDate}</span>}
                        {cert.expiryDate && <span>• Expires {cert.expiryDate}</span>}
                      </div>
                      {cert.credentialId && <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">ID: {cert.credentialId}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Projects */}
          <TabsContent value="projects" className="mt-4 space-y-4">
            {profile.projects.length === 0 ? (
              <Card className="border-border"><CardContent className="p-5 text-xs text-muted-foreground">No projects yet.</CardContent></Card>
            ) : profile.projects.map((project) => (
              <Card key={project.id} className="border-border">
                <CardContent className="p-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-semibold text-foreground">{project.name}</h4>
                      {project.url && (
                        <a href={project.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <p className="text-[12px] text-foreground mt-1 leading-relaxed">{project.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(project.technologies || []).map(t => (
                        <Badge key={t} variant="secondary" className="text-[10px] h-5 px-1.5">{t}</Badge>
                      ))}
                    </div>
                    {(project.startDate || project.endDate) && (
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {project.startDate}{project.endDate ? ` – ${project.endDate}` : " – Present"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Resume History */}
          <TabsContent value="resume" className="mt-4">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-sm">Resume Versions</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handlePreviewResume}>
                      <Eye size={11} /> Preview
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleDownloadResume}>
                      <Download size={11} /> Download
                    </Button>
                    <Button size="sm" className="h-7 text-xs gap-1" disabled={syncingResume} onClick={() => document.getElementById('resume-upload')?.click()}>
                      <Upload size={11} /> Upload New
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-3">
                {profile.resumeHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No resumes uploaded yet.</p>
                ) : profile.resumeHistory.map((version, i) => (
                  <div key={i} className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    i === 0 ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", i === 0 ? "bg-primary/20" : "bg-muted")}>
                        <FileText size={14} className={i === 0 ? "text-primary" : "text-muted-foreground"} />
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-foreground">{version.version}</p>
                        <p className="text-[10px] text-muted-foreground">Uploaded {version.uploadedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={cn("text-sm font-bold", version.score >= 85 ? "text-chart-3" : version.score >= 70 ? "text-chart-2" : "text-chart-4")}>
                          {version.score}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Score</p>
                      </div>
                      {i === 0 && <Badge className="text-[9px] h-4 bg-primary/15 text-primary border-primary/30">Active</Badge>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showResumePreview} onOpenChange={(open) => {
          setShowResumePreview(open);
          if (!open && previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }
        }}>
          <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Resume Preview</DialogTitle>
              <DialogDescription>Latest resume from the server</DialogDescription>
            </DialogHeader>
            {previewUrl ? (
              <iframe title="Resume preview" src={previewUrl} className="flex-1 w-full rounded border border-border min-h-[60vh]" />
            ) : (
              <p className="text-sm text-muted-foreground">Loading preview…</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
