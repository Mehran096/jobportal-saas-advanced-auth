import { baseApi } from "./baseApi";

export interface IProfile {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: "jobseeker" | "employer" | "admin";
  profileImage: string;
  resumeUrl: string;
  resumeName: string;
  headline: string;
  bio: string;
  skills: string[];
  phone: string;
  location: string;
}

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    getProfile: builder.query<IProfile, void>({
      query: () => "/profile",
      providesTags: ["Profile"],
      keepUnusedDataFor: 0,
    }),

    updateProfile: builder.mutation<IProfile, Partial<IProfile>>({
      query: (body) => ({
        url: "/profile",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),

  }),
});

export const { 
  useGetProfileQuery, 
  useUpdateProfileMutation 
} = profileApi;