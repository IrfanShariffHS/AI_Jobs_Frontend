export type JobStatus = "saved" | "applied" | "pending" | "interview" | "offer" | "rejected" | "withdrawn";
export type AutomationStatus = "idle" | "running" | "paused" | "completed" | "failed";
export type EmailStatus = "sent" | "delivered" | "opened" | "failed" | "pending";

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  salary: string;
  salaryMin: number;
  salaryMax: number;
  experience: string;
  type: "Full-time" | "Part-time" | "Contract" | "Remote" | "Hybrid";
  remote: boolean;
  matchScore: number;
  postedAt: string;
  description: string;
  skills: string[];
  missingSkills: string[];
  matchingSkills?: string[];
  benefits: string[];
  recruiterName: string;
  recruiterTitle: string;
  recruiterEmail: string;
  applicants: number;
  category: string;
  atsScore: number;
  experienceMatch?: number;
  educationMatch?: number;
  keywordMatch?: number;
  recruiterRelevance?: number;
  autoApplyReason?: string;
  profileImprovements?: string[];
  isEligible?: boolean;
  matchAnalysis?: string;
  status?: JobStatus;
  saved?: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  status: JobStatus;
  appliedAt: string;
  lastUpdate: string;
  nextStep?: string;
  notes?: string;
  salary: string;
  location: string;
  matchScore: number;
  recruiterName?: string;
  interviewDate?: string;
  offerAmount?: string;
}

export interface Skill {
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExp: number;
  trending?: boolean;
  gap?: boolean;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
  skills: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  field: string;
  startYear: number;
  endYear: number | null;
  gpa?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  startDate: string;
  endDate?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  avatar: string;
  resumeScore: number;
  atsScore: number;
  profileCompletion: number;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
  resumeHistory: { version: string; uploadedAt: string; score: number }[];
  linkedInConnected: boolean;
  naukriConnected: boolean;
}

export interface AutomationJob {
  id: string;
  type: "job_apply" | "resume_refresh" | "profile_update" | "email_recruiter";
  status: AutomationStatus;
  progress: number;
  total: number;
  startedAt: string;
  completedAt?: string;
  logs: { time: string; message: string; type: "info" | "success" | "error" | "warning" }[];
  stats: { applied: number; skipped: number; failed: number; saved: number };
}

export interface Recruiter {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  linkedIn?: string;
  lastContacted?: string;
  emailStatus?: EmailStatus;
  responseRate: number;
  industry: string;
}

export interface Notification {
  id: string;
  type: "job" | "ai" | "resume" | "scheduler" | "email" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "low" | "medium" | "high";
  actionUrl?: string;
}
