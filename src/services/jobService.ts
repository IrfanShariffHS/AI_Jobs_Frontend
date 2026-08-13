import { apiService, ApiResponse } from './api';
import { withCache, invalidateCache, forceRefresh } from '../utils/cache';

export interface MatchBreakdown {
  match_score?: number;
  match_analysis?: string;
  matching_skills?: string | string[];
  missing_skills?: string | string[];
  experience_match?: number;
  education_match?: number;
  ats_compatibility?: number;
  keyword_match?: number;
  recruiter_relevance?: number;
  auto_apply_eligible?: boolean;
  auto_apply_reason?: string;
  profile_improvements?: string[];
  threshold?: number;
  strengths?: string;
}

export interface JobPosting {
  id: number;
  title: string;
  jobTitle?: string;
  company: string;
  companyName?: string;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  matchScore: number;
  matchAnalysis?: string;
  missingSkills?: string[];
  matchingSkills?: string | string[];
  matchBreakdown?: MatchBreakdown;
  isEligible?: boolean;
  platform: string;
  postedDate: string;
  jobUrl?: string;
  userId: number;
  createdAt: string;
}

export interface JobSearchResponse {
  success: boolean;
  data: {
    totalFound: number;
    jobs: JobPosting[];
    platformBreakdown: Record<string, number>;
  };
}

export interface JobListResponse {
  success: boolean;
  count: number;
  jobs: JobPosting[];
}

export const jobService = {
  async searchJobs(): Promise<ApiResponse<JobSearchResponse['data']>> {
    return withCache('jobs-search', async () => {
      return apiService.get<JobSearchResponse['data']>('/api/jobs/search');
    });
  },

  async getJobListings(): Promise<ApiResponse<JobListResponse>> {
    return withCache('jobs-list', async () => {
      return apiService.get<JobListResponse>('/api/jobs/list');
    });
  },

  async getJobById(id: number): Promise<ApiResponse<JobPosting>> {
    return withCache(`job-${id}`, async () => {
      return apiService.get<JobPosting>(`/api/jobs/${id}`);
    });
  },

  // Force refresh methods
  async refreshJobs(): Promise<ApiResponse<JobSearchResponse['data']>> {
    return forceRefresh('jobs-search', async () => {
      return apiService.get<JobSearchResponse['data']>('/api/jobs/search');
    });
  },
};
