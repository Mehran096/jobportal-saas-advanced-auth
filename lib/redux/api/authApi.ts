// lib/redux/api/authApi.ts - FINAL VERSION WITH FORGOT + RESET
import { baseApi } from "./baseApi";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: 'jobseeker' | 'employer' | 'admin';
}

interface AuthResponse {
  user: User;
  message: string;
}

export const authApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Register - your own API
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

    // FORGOT PASSWORD
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    // RESET PASSWORD
    resetPassword: builder.mutation<{ message: string }, { token: string; password: string }>({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation
} = authApi;