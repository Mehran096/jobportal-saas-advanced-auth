import { baseApi } from "./baseApi";

// Job type with populated postedBy
interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary: string;
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
  status: "pending" | "reviewed" | "shortlisted" | "accepted" | "rejected";
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
    // 1. Get My Posted Jobs
    getMyJobs: builder.query<{ jobs: Job[] }, void>({
      query: () => "/jobs/my-jobs",
      providesTags: ["Jobs"],
    }),

    // 2. Get Single Job By ID
    getJobById: builder.query<{ job: Job; applicationCount: number }, string>({
      query: (id) => `/jobs/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Jobs", id }],
    }),

    // 3. Create Job
    createJob: builder.mutation<{ message: string; job: Job }, Partial<Job>>({
      query: (jobData) => ({
        url: "/jobs",
        method: "POST",
        body: jobData,
      }),
      invalidatesTags: ["Jobs", "Employer"],
    }),

    // 4. Update Job
    updateJob: builder.mutation<{ message: string; job: Job }, { id: string; data: Partial<Job> }>({
      query: ({ id, data }) => ({
        url: `/jobs/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Jobs",
        { type: "Jobs", id },
      ],
    }),

    // 5. Delete Job
    deleteJob: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/jobs/${id}`, method: "DELETE" }),
      invalidatesTags: ["Jobs", "Employer"],
    }),

    // 6. Get Applicants for Specific Job
    getApplicationsByJob: builder.query<{ applications: Application[] }, string>({
      query: (jobId) => `/applications/job/${jobId}`,
      providesTags: ["Applications"],
    }),

    // 7. Get All Applications for Employer
    getAllApplications: builder.query<{ applications: Application[] }, void>({
      query: () => "/applications/employer",
      providesTags: ["Applications"],
    }),

//      getEmployerApplicants: builder.query<{ applications: Application[] }, void>({
//       query: () => "/employer/applicants",
//       providesTags: ["Applications"],
//     }),

//     getApplicants: builder.query<{ applications: Application[] }, void>({
//   query: () => "/employer/applicants",
//   providesTags: ["Applications"],
// }),

    // 8. Update Application Status
    updateApplicationStatus: builder.mutation<{ message: string; application: Application }, { id: string; status: "pending" | "reviewed" | "shortlisted" | "accepted" | "rejected" }>({
      query: ({ id, status }) => ({ 
        url: `/applications/${id}`, 
        method: "PATCH",
        body: { status } 
      }),
      invalidatesTags: ["Applications", "Employer"],
    }),

    // 9. Employer Dashboard Stats
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
  // useGetEmployerApplicantsQuery,
  // useGetApplicantsQuery,
  useUpdateApplicationStatusMutation,
  useGetEmployerStatsQuery
} = employerApi;