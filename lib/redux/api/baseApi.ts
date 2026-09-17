// lib/redux/api/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  // just return, don't dispatch here to avoid circular dep + any
  // 401 handling will be done in DashboardHeader logout
  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithReauth,
  keepUnusedDataFor: 0,
  tagTypes: ["Jobs", "Applications", "Notifications", "JobSeeker", "Employer", "Auth", "Profile"],
  endpoints: () => ({}),
});