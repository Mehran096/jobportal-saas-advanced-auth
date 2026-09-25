// lib/redux/api/adminApi.ts - FINAL CLEAN - ONLY banUser
import { baseApi } from "./baseApi";

export interface AdminStats {
  totalUsers: number;
  totalEmployers: number;
  totalJobseekers: number;
  totalJobs: number;
  totalApplications: number;
  recentUsers: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
}

export interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "jobseeker" | "employer" | "admin";
  isBanned: boolean;
  bannedReason?: string;
  bannedAt?: string;
  createdAt: string;
}

export interface AdminJob {
  _id: string;
  title: string;
  company: string;
  location: string;
  postedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
}

export interface Appeal {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isBanned: boolean;
    bannedReason?: string;
    bannedAt?: string;
  };
  email: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: string;
}

export interface Pagination {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminStats: builder.query<AdminStats, void>({
      query: () => "/admin/stats",
      providesTags: ["Admin"],
    }),

    getAllUsersAdmin: builder.query<
      { users: AdminUser[]; pagination: Pagination },
      { role?: string; search?: string; page?: number; limit?: number }
    >({
      query: ({ role, search, page = 1, limit = 10 }) => {
        const params = new URLSearchParams();
        if (role && role!== "All") params.append("role", role);
        if (search) params.append("search", search);
        params.append("page", String(page));
        params.append("limit", String(limit));
        return `/admin/users?${params.toString()}`;
      },
      providesTags: ["Admin"],
    }),

    // ONLY ban system - use everywhere
    banUser: builder.mutation<
      { message: string; user: AdminUser },
      { userId: string; reason?: string; action?: "ban" | "unban" }
    >({
      query: ({ userId, reason, action = "ban" }) => ({
        url: `/admin/users/${userId}/ban`,
        method: "PATCH",
        body: { reason, action },
      }),
      invalidatesTags: ["Admin"],
    }),

    getAllJobsAdmin: builder.query<
      { jobs: AdminJob[]; pagination: Pagination },
      { search?: string; page?: number; limit?: number } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.search) params.append("search", args.search);
        params.append("page", String(args?.page || 1));
        params.append("limit", String(args?.limit || 10));
        return `/admin/jobs?${params.toString()}`;
      },
      providesTags: ["Admin"],
    }),

    deleteJobAdmin: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/admin/jobs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Admin"],
    }),

    getAppeals: builder.query<{ appeals: Appeal[] }, void>({
      query: () => "/admin/appeals",
      providesTags: ["Admin"],
    }),

    reviewAppeal: builder.mutation<
      { message: string; appeal: Appeal },
      { id: string; decision: "approved" | "rejected"; adminNote?: string }
    >({
      query: ({ id, decision, adminNote }) => ({
        url: `/admin/appeals/${id}`,
        method: "POST",
        body: { decision, adminNote },
      }),
      invalidatesTags: ["Admin"],
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetAllUsersAdminQuery,
  useBanUserMutation,
  useGetAllJobsAdminQuery,
  useDeleteJobAdminMutation,
  useGetAppealsQuery,
  useReviewAppealMutation,
} = adminApi;