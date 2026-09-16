// lib/redux/api/baseApi.ts
import { createApi, fetchBaseQuery, BaseQueryFn } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include', // <-- THIS IS THE KEY: sends next-auth cookie
});

const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  
  // 401 = session expired / not logged in
  if (result.error?.status === 401) {
    if (typeof window !== 'undefined') {
      // No more localStorage.removeItem("token")
      api.dispatch(baseApi.util.resetApiState()); // clear RTK cache
      // Don't force window.location here - let the component handle it
      // If you want auto redirect, uncomment:
      // window.location.href = '/login';
    }
  }
  
  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Jobs", "Applications", "Notifications", "JobSeeker", "Employer", "Auth", "Profile"],
  endpoints: () => ({}),
});