import { apiService, ApiResponse } from './api';
import { withCache, invalidateCache, forceRefresh } from '../utils/cache';

export interface HrContact {
  id: number;
  email: string;
  hrName: string | null;
  companyName: string | null;
  jobTitle: string | null;
  designation: string | null;
  subject: string | null;
  phoneNumber: string | null;
  linkedInProfile: string | null;
  companyWebsite: string | null;
  naukriUrl: string | null;
  sourceAccount: string | null;
  location: string | null;
  salary: string | null;
  experienceRequired: string | null;
  skillsRequired: string | null;
  jobDescriptionSummary: string | null;
  alreadyReplied: boolean;
  dateReceived: string | null;
  status: string | null;
  duplicateCount: number;
  userId: number;
  createdAt: string;
}


export interface RecruiterListResponse {
  success: boolean;
  count: number;
  recruiters: HrContact[];
}

export const recruiterService = {
  async getRecruiters(filters?: {
    company?: string;
    replied?: boolean;
  }): Promise<ApiResponse<RecruiterListResponse>> {
    const params = new URLSearchParams();
    if (filters?.company) params.append('company', filters.company);
    if (filters?.replied !== undefined) params.append('replied', filters.replied.toString());
    
    const queryString = params.toString();
    const cacheKey = queryString ? `recruiters-${queryString}` : 'recruiters';
    const endpoint = queryString ? `/api/recruiters?${queryString}` : '/api/recruiters';
    
    return withCache(cacheKey, async () => {
      return apiService.get<RecruiterListResponse>(endpoint);
    });
  },

  async getRecruiterById(id: number): Promise<ApiResponse<{ recruiter: HrContact }>> {
    return withCache(`recruiter-${id}`, async () => {
      return apiService.get<{ recruiter: HrContact }>(`/api/recruiters/${id}`);
    });
  },

  async addRecruiter(data: {
    email: string;
    hrName?: string;
    companyName?: string;
    jobTitle?: string;
    subject?: string;
  }): Promise<ApiResponse<{ recruiter: HrContact }>> {
    const result = await apiService.post<{ recruiter: HrContact }>('/api/recruiters', data);
    // Invalidate cache when recruiter is added
    if (result.success) {
      invalidateCache('recruiters');
    }
    return result;
  },

  async updateRecruiter(
    id: number,
    data: {
      hrName?: string;
      companyName?: string;
      jobTitle?: string;
      subject?: string;
    }
  ): Promise<ApiResponse<{ recruiter: HrContact }>> {
    const result = await apiService.put<{ recruiter: HrContact }>(`/api/recruiters/${id}`, data);
    // Invalidate cache when recruiter is updated
    if (result.success) {
      invalidateCache('recruiters');
    }
    return result;
  },

  async deleteRecruiter(id: number): Promise<ApiResponse<{ message: string }>> {
    const result = await apiService.delete<{ message: string }>(`/api/recruiters/${id}`);
    // Invalidate cache when recruiter is deleted
    if (result.success) {
      invalidateCache('recruiters');
    }
    return result;
  },

  async extractFromGmail(email: string, password: string): Promise<ApiResponse<{
    success?: boolean;
    extractedCount?: number;
    results?: Array<Record<string, unknown>>;
    message?: string;
    error?: string;
  }>> {
    return apiService.post('/api/extractor/extract', {
      email,
      password,
      saveToExcel: false,
    });
  },

  async getExtractedContacts(): Promise<ApiResponse<{
    success?: boolean;
    results?: Array<Record<string, unknown>>;
    contacts?: Array<Record<string, unknown>>;
  }>> {
    return withCache('extracted-contacts', async () => {
      return apiService.get('/api/extractor/results');
    });
  },

  // Force refresh methods
  async refreshRecruiters(filters?: {
    company?: string;
    replied?: boolean;
  }): Promise<ApiResponse<RecruiterListResponse>> {
    const params = new URLSearchParams();
    if (filters?.company) params.append('company', filters.company);
    if (filters?.replied !== undefined) params.append('replied', filters.replied.toString());
    
    const queryString = params.toString();
    const cacheKey = queryString ? `recruiters-${queryString}` : 'recruiters';
    const endpoint = queryString ? `/api/recruiters?${queryString}` : '/api/recruiters';
    
    return forceRefresh(cacheKey, async () => {
      return apiService.get<RecruiterListResponse>(endpoint);
    });
  },
};
