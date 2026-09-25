import { baseApi } from "./baseApi";

export type ReportReason = "spam" | "fake_job" | "abuse" | "scam" | "inappropriate_content" | "other";

export interface ReportUserPayload {
  reportedUser: string;
  reason: ReportReason;
  details?: string;
  jobId?: string;
}

export interface Report {
  _id: string;
  reportedUser: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isBanned?: boolean;
  };
  reportedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reason: ReportReason;
  details?: string;
  jobId?: { _id: string; title: string; company?: string } | null;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
}

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    reportUser: builder.mutation<{ message: string; report?: Report }, ReportUserPayload>({
      query: (body) => ({
        url: "/reports",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Report"],
    }),

    getReports: builder.query<{ reports: Report[] }, void>({
      query: () => "/reports",
      providesTags: (result) =>
        result?.reports
          ? [
              ...result.reports.map(({ _id }) => ({ type: "Report" as const, id: _id })),
              { type: "Report" as const, id: "LIST" },
            ]
          : [{ type: "Report" as const, id: "LIST" }],
    }),

    updateReportStatus: builder.mutation<
      { message: string; report: Report },
      { id: string; status: "reviewed" | "dismissed" }
    >({
      query: ({ id, status }) => ({
        url: `/reports/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Report", id },
        { type: "Report", id: "LIST" },
      ],
    }),

    deleteReport: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/reports/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Report", id },
        { type: "Report", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useReportUserMutation,
  useGetReportsQuery,
  useUpdateReportStatusMutation,
  useDeleteReportMutation,
} = reportApi;