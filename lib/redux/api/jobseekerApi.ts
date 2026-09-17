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
  status: "pending" | "shortlisted" | "accepted" | "rejected";
  resumeUrl?: string;
  snapshot: ApplicationSnapshot;
  createdAt: string;
}

export interface JobseekerStats {
  totalApplications: number;
  interviews: number;
  savedJobs: number;
}

type ApplicationsResponse = Application[] | { applications: Application[] };

export const jobseekerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllJobs: builder.query<{ jobs: Job[]; count?: number }, { search?: string; location?: string } | void>({
      query: (params) => ({
        url: "/jobs",
        params: params ?? {},
      }),
      providesTags: ["Jobs"],
    }),

    applyForJob: builder.mutation<{ message: string; application: Application }, string>({
      query: (jobId) => ({
        url: `/jobs/${jobId}/apply`,
        method: "POST",
        body: { job: jobId },
      }),
      invalidatesTags: ["Applications", "JobSeeker"],
    }),

    getMyApplications: builder.query<Application[], void>({
      query: () => "/applications/my-applications",
      providesTags: ["Applications"],
      transformResponse: (response: ApplicationsResponse) => {
        if (Array.isArray(response)) return response;
        return response.applications ?? [];
      },
    }),

    getJobseekerStats: builder.query<JobseekerStats, void>({
      query: () => "/jobseeker/stats",
      providesTags: ["JobSeeker"],
    }),

    // --- NEW SAVED JOBS ---
    getSavedJobs: builder.query<{ savedJobs: Job[] }, void>({
      query: () => "/saved-jobs",
      providesTags: ["SavedJobs"],
    }),

    saveJob: builder.mutation<{ message: string }, string>({
      query: (jobId) => ({
        url: "/saved-jobs",
        method: "POST",
        body: { jobId },
      }),
      invalidatesTags: ["SavedJobs", "JobSeeker"],
    }),

    unsaveJob: builder.mutation<{ message: string }, string>({
      query: (jobId) => ({
        url: `/saved-jobs/${jobId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SavedJobs", "JobSeeker"],
    }),
  }),
});

export const {
  useGetAllJobsQuery,
  useApplyForJobMutation,
  useGetMyApplicationsQuery,
  useGetJobseekerStatsQuery,
  useGetSavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
} = jobseekerApi;