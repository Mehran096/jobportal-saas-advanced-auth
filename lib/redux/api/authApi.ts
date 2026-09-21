// lib/redux/api/authApi.ts - FINAL VERSION WITH CHANGE + SET PASSWORD
import { baseApi } from "./baseApi";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  fullName: string;
  email: string;
  role: 'jobseeker' | 'employer' | 'admin';
  provider: 'credentials' | 'google' | 'both'; // <-- ADD BOTH
  image?: string;
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

    // --- MY ACCOUNT ---
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

    // --- NEW: CHANGE PASSWORD (for credentials / both) ---
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

    // --- NEW: SET PASSWORD (for pure google -> both) ---
    setPassword: builder.mutation<MessageResponse, {
      newPassword: string;
    }>({
      query: (body) => ({
        url: "/auth/set-password",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"], // to refresh provider = both
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
} = authApi;