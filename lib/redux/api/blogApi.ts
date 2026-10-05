import { baseApi } from "./baseApi";

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: { _id: string; name: string; image?: string; email?: string; };
  category: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface Pagination { total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrev: boolean; }
interface BlogsResponse { success: boolean; blogs: Blog[]; pagination: Pagination; }
interface BlogResponse { success: boolean; blog: Blog; }
interface BlogParams { category?: string; search?: string; page?: number; limit?: number; }

interface CreateBlogPayload {
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  author: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
}

export const blogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBlogs: builder.query<BlogsResponse, BlogParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.category && params.category !== "All") searchParams.append("category", params.category);
        if (params?.search) searchParams.append("search", params.search);
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.limit) searchParams.append("limit", params.limit.toString());
        const qs = searchParams.toString();
        return `/blogs${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Blog"],
      keepUnusedDataFor: 60,
    }),

    getBlogBySlug: builder.query<BlogResponse, string>({
      query: (slug) => `/blogs/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Blog", id: slug }],
      keepUnusedDataFor: 300,
    }),

    createBlog: builder.mutation<BlogResponse, CreateBlogPayload>({
      query: (body) => ({ url: "/blogs", method: "POST", body }),
      invalidatesTags: ["Blog"],
    }),

    updateBlog: builder.mutation<BlogResponse, { slug: string; data: Partial<Blog> }>({
      query: ({ slug, data }) => ({ url: `/blogs/${slug}`, method: "PUT", body: data }),
      invalidatesTags: (result, error, { slug }) => [{ type: "Blog", id: slug }, "Blog"],
    }),

    deleteBlog: builder.mutation<{ success: boolean; message: string }, string>({
      query: (slug) => ({ url: `/blogs/${slug}`, method: "DELETE" }),
      invalidatesTags: ["Blog"],
    }),
  }),
});

export const { useGetBlogsQuery, useGetBlogBySlugQuery, useCreateBlogMutation, useUpdateBlogMutation, useDeleteBlogMutation } = blogApi;