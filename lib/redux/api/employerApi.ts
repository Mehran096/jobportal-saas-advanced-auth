import { baseApi } from "./baseApi";

interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary: number;
  type?: string; // Full-time, Part-time, Remote, Contract, Internship
  salaryMin?: number;
  salaryMax?: number;
  createdAt: string;
  postedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
  };
  applicationCount?: number;
}

interface Applicant {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Application {
  _id: string;
  job: { _id: string; title: string; company?: string; location?: string };
  applicant: Applicant;
  status: "pending" | "shortlisted" | "accepted" | "rejected";
  resumeUrl?: string;
  snapshot?: {
    firstName: string;
    lastName: string;
    email: string;
    headline?: string;
    bio?: string;
    phone?: string;
    location?: string;
    profileImage?: string;
    resumeUrl: string;
    resumeName?: string;
    skills?: string[];
  };
  createdAt: string;
}

interface EmployerStats {
  totalJobs: number;
  totalApplicants: number;
  pendingApplicants: number;
  hired: number;
  recentApplications: Application[];
}

export const employerApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getMyJobs: builder.query<{ jobs: Job[] }, void>({
      query: () => "/jobs/my-jobs",
      providesTags: ["Jobs"],
    }),

    getJobById: builder.query<{ job: Job; applicationCount: number }, string>({
      query: (id) => `/jobs/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Jobs", id }],
    }),

    createJob: builder.mutation<{ message: string; job: Job }, Partial<Job>>({
      query: (jobData) => ({
        url: "/jobs",
        method: "POST",
        body: {
          ...jobData,
          salary: jobData.salary ? Number(jobData.salary) : undefined,
          salaryMin: jobData.salaryMin ? Number(jobData.salaryMin) : undefined,
          salaryMax: jobData.salaryMax ? Number(jobData.salaryMax) : undefined,
        },
      }),
      invalidatesTags: ["Jobs", "Employer"],
    }),

    updateJob: builder.mutation<{ message: string; job: Job }, { id: string; data: Partial<Job> }>({
      query: ({ id, data }) => ({
        url: `/jobs/${id}`,
        method: "PUT",
        body: {
          ...data,
          salary: data.salary ? Number(data.salary) : undefined,
          salaryMin: data.salaryMin ? Number(data.salaryMin) : undefined,
          salaryMax: data.salaryMax ? Number(data.salaryMax) : undefined,
        },
      }),
      invalidatesTags: (_result, _error, { id }) => ["Jobs", { type: "Jobs", id }],
    }),

    deleteJob: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/jobs/${id}`, method: "DELETE" }),
      invalidatesTags: ["Jobs", "Employer"],
    }),

    getApplicationsByJob: builder.query<{ applications: Application[] }, string>({
      query: (jobId) => `/applications/job/${jobId}`,
      providesTags: ["Applications"],
    }),

    getAllApplications: builder.query<{ applications: Application[] }, void>({
      query: () => "/applications/employer",
      providesTags: ["Applications"],
    }),

    getApplicationById: builder.query<{ application: Application; job: { _id: string; title: string } }, string>({
      query: (id) => `/applications/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Applications", id }],
    }),

    updateApplicationStatus: builder.mutation<{ message: string; application: Application }, { id: string; status: "pending" | "shortlisted" | "accepted" | "rejected" }>({
      query: ({ id, status }) => ({
        url: `/applications/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Applications", "Employer"],
    }),

    getEmployerStats: builder.query<EmployerStats, void>({
      query: () => "/employer/stats",
      providesTags: ["Employer"],
    }),
  }),
});

export const {
  useGetMyJobsQuery,
  useGetJobByIdQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useGetApplicationsByJobQuery,
  useGetAllApplicationsQuery,
  useGetApplicationByIdQuery,
  useUpdateApplicationStatusMutation,
  useGetEmployerStatsQuery,
} = employerApi;