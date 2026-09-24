// lib/redux/api/authApi.ts - FINAL WITH APPEAL + CHANGE + SET PASSWORD
import { baseApi } from "./baseApi";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  fullName: string;
  email: string;
  role: 'jobseeker' | 'employer' | 'admin';
  provider: 'credentials' | 'google' | 'both';
  image?: string;
  isBanned?: boolean;
  bannedReason?: string;
}

interface AuthResponse {
  user: User;
  message: string;
}

interface MyAccountResponse {
  user: User;
  message: string;
}

interface MessageResponse {
  message: string;
}

export const authApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      role: string
    }>({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),

    forgotPassword: builder.mutation<MessageResponse, { email: string }>({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    resetPassword: builder.mutation<MessageResponse, { token: string; password: string }>({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),

    getMyAccount: builder.query<MyAccountResponse, void>({
      query: () => "/auth/myaccount",
      providesTags: ["Auth"],
    }),

    updateMyAccount: builder.mutation<MyAccountResponse, {
      firstName?: string;
      lastName?: string;
      email?: string;
    }>({
      query: (body) => ({
        url: "/auth/myaccount",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    deleteMyAccount: builder.mutation<MessageResponse, void>({
      query: () => ({
        url: "/auth/myaccount",
        method: "DELETE",
      }),
      invalidatesTags: ["Auth"],
    }),

    changePassword: builder.mutation<MessageResponse, {
      currentPassword: string;
      newPassword: string;
    }>({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
    }),

    setPassword: builder.mutation<MessageResponse, {
      newPassword: string;
    }>({
      query: (body) => ({
        url: "/auth/set-password",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    // --- NEW: BANNED USER APPEAL (public, no admin auth) ---
    submitAppeal: builder.mutation<MessageResponse, {
      email: string;
      message: string;
    }>({
      query: (body) => ({
        url: "/support/appeal",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMyAccountQuery,
  useUpdateMyAccountMutation,
  useDeleteMyAccountMutation,
  useChangePasswordMutation,
  useSetPasswordMutation,
  useSubmitAppealMutation,
} = authApi;