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

    // NEW: delete file from UploadThing storage
    deleteFile: builder.mutation<
      { success: boolean; deleted?: string },
      { url?: string; fileKey?: string }
    >({
      query: (body) => ({
        url: "/uploadthing/delete",
        method: "POST",
        body,
      }),
    }),

    // NEW: clear profile data (keep user login)
    deleteProfile: builder.mutation<
      { success: boolean; message?: string },
      void
    >({
      query: () => ({
        url: "/profile",
        method: "DELETE",
      }),
      invalidatesTags: ["Profile"],
    }),

  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useDeleteFileMutation,
  useDeleteProfileMutation,
} = profileApi;