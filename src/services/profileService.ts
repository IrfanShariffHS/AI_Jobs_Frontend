import { apiService, ApiResponse } from './api';
import { withCache, invalidateCache, forceRefresh } from '../utils/cache';

export interface ProfileSkill {
  id?: number | string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | string;
  yearsOfExp?: number;
  category?: string;
  featured?: boolean;
  trending?: boolean;
  gap?: boolean;
}

export interface ProfileExperience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
  skills: string[];
  achievements?: string;
  department?: string;
}

export interface ProfileEducation {
  id: string;
  degree: string;
  institution: string;
  field: string;
  startYear: number | null;
  endYear: number | null;
  gpa?: string;
  description?: string;
  current?: boolean;
}

export interface ProfileCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string | null;
  credentialId: string;
  credentialUrl?: string;
}

export interface ProfileProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  startDate: string;
  endDate?: string | null;
}

export interface ResumeHistoryItem {
  id?: number;
  version: string;
  filename?: string;
  uploadedAt: string;
  status?: string;
  score: number;
  md5Hash?: string;
}

export interface UserProfileUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name?: string;
  fullName?: string;
  phone: string | null;
  location?: string | null;
  city?: string | null;
  preferredLocation?: string | null;
  headline?: string | null;
  summary?: string | null;
  currentCompany?: string | null;
  currentDesignation?: string | null;
  yearsOfExperience?: string | null;
  currentCTC?: string | null;
  expectedCTC?: string | null;
  noticePeriod?: string | null;
  preferredJobRole?: string | null;
  employmentType?: string | null;
  highestQualification?: string | null;
  skillsString?: string | null;
  naukriEmail: string | null;
  linkedInEmail: string | null;
  activeResumeId: number | null;
  profileSyncEnabled: boolean;
  gmailVerified: boolean;
  onboardingCompleted: boolean;
  createdAt?: string;
  resumeScore?: number;
  atsScore?: number;
  profileScore?: number;
  profileCompletion?: number;
  linkedInConnected?: boolean;
  naukriConnected?: boolean;
}

export interface FullProfileResponse {
  success?: boolean;
  user: UserProfileUser;
  skills: ProfileSkill[];
  experience: ProfileExperience[];
  education: ProfileEducation[];
  certifications: ProfileCertification[];
  projects: ProfileProject[];
  languages: string[];
  contact?: Record<string, unknown>;
  resumeHistory: ResumeHistoryItem[];
  resumeInformation?: Record<string, unknown> | null;
  personalInformation?: Record<string, unknown> | null;
  completeness?: Record<string, unknown>;
  hasResume?: boolean;
}

export interface ProfileCompletionData {
  fullName: string;
  email: string;
  mobile: string;
  dateOfBirth: string;
  currentCity: string;
  preferredLocation: string;
  currentCompany: string;
  currentDesignation: string;
  yearsOfExperience: string;
  currentCTC: string;
  expectedCTC: string;
  noticePeriod: string;
  preferredJobRole: string;
  employmentType: string;
  highestQualification: string;
  skills: string[];
  summary: string;
}

/** @deprecated Use UserProfileUser — kept for compatibility */
export type UserProfile = UserProfileUser;

export const profileService = {
  async getUserProfile(): Promise<ApiResponse<FullProfileResponse>> {
    return withCache('user-profile', async () => {
      return apiService.get<FullProfileResponse>('/api/profile');
    });
  },

  async updateUserProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    naukriEmail?: string;
    linkedInEmail?: string;
    activeResumeId?: number;
    profileSyncEnabled?: boolean;
  }): Promise<ApiResponse<{ user: UserProfileUser }>> {
    const result = await apiService.put<{ user: UserProfileUser }>('/api/profile', data);
    // Invalidate cache when profile is updated
    if (result.success) {
      invalidateCache('profile');
    }
    return result;
  },

  async completeProfile(data: ProfileCompletionData): Promise<ApiResponse<{ success: boolean }>> {
    const result = await apiService.post<{ success: boolean }>('/api/profile/complete', data);
    // Invalidate cache when profile is completed
    if (result.success) {
      invalidateCache('profile');
    }
    return result;
  },

  async uploadResume(file: File): Promise<ApiResponse<{ resumeId: number; parsedData: any; uploadHistory?: any }>> {
    const result = await apiService.upload<{ resumeId: number; parsedData: any; uploadHistory?: any }>('/api/resume/upload', file);
    // Invalidate cache when resume is uploaded
    if (result.success) {
      invalidateCache('profile');
    }
    return result;
  },

  async parseResume(resumeId?: number): Promise<ApiResponse<{ data: any }>> {
    return withCache(`resume-parse-${resumeId || 'latest'}`, async () => {
      return apiService.post<{ data: any }>('/api/resume/parse', resumeId != null ? { resumeId } : {});
    });
  },

  async getAiRecommendations(): Promise<ApiResponse<{ data: AiRecommendation[]; count: number } | AiRecommendation[]>> {
    return withCache('ai-recommendations', async () => {
      return apiService.get<{ data: AiRecommendation[]; count: number } | AiRecommendation[]>('/api/profile/recommendations');
    });
  },

  // Force refresh methods
  async refreshProfile(): Promise<ApiResponse<FullProfileResponse>> {
    return forceRefresh('user-profile', async () => {
      return apiService.get<FullProfileResponse>('/api/profile');
    });
  },
};

export interface AiRecommendation {
  id: string;
  type: string;
  title: string;
  impact: string;
  priority: string;
  explanation?: string;
  category?: string;
  action?: string;
  skillName?: string;
  demand?: number;
  growth?: string;
  recommendation_score?: number;
  frequency?: number;
  relevance_score?: number;
  jobId?: number;
  matchScore?: number;
  missingSkills?: string;
}
