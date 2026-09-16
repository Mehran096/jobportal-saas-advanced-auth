import { baseApi } from "./baseApi";

export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description?: string;
  createdAt?: string;
}

export interface ApplicationSnapshot {
  firstName: string;
  lastName: string;
  headline: string;
  bio: string;
  phone: string;
  location: string;
  profileImage: string;
  resumeUrl: string;
  resumeName: string;
  skills: string[];
  email: string;
}

export interface Application {
  _id: string;
  job: Job;
  applicant?: string;
  employer?: string;
  status: "pending" | "reviewed" | "shortlisted" | "accepted" | "rejected";
  resumeUrl?: string;
  snapshot: ApplicationSnapshot;
  createdAt: string;
}

export interface JobseekerStats {
  totalApplications: number;
  interviews: number;
  savedJobs: number;
}

export const jobseekerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllJobs: builder.query<{ jobs: Job[] }, { search?: string; location?: string } | void>({
      query: (params) => ({
        url: "/jobs",
        params,
      }),
      providesTags: ["Jobs"],
    }),

    // FIXED: matches your backend app/api/application/route.ts
    applyForJob: builder.mutation<{ message: string; application: Application }, string>({
      query: (jobId) => ({
         url: `/jobs/${jobId}/apply`,
        method: "POST",
        body: { job: jobId },
      }),
      invalidatesTags: ["Applications", "JobSeeker"],
    }),

    // FIXED: GET /api/application (not /applications/my-applications)
    getMyApplications: builder.query<Application[] | { applications: Application[] }, void>({
      query: () => "/applications/my-applications",
      providesTags: ["Applications"],
      // normalize both array or object responses
      transformResponse: (response: any) => {
        return Array.isArray(response) ? response : response.applications || [];
      }
    }),

    getJobseekerStats: builder.query<JobseekerStats, void>({
      query: () => "/jobseeker/stats",
      providesTags: ["JobSeeker"],
    }),
  }),
});

export const {
  useGetAllJobsQuery,
  useApplyForJobMutation,
  useGetMyApplicationsQuery,
  useGetJobseekerStatsQuery,
} = jobseekerApi;