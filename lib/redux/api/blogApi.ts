import { baseApi } from "./baseApi";

export interface Blog {
  _id: string; title: string; slug: string; excerpt: string;
  content: string; coverImage: string;
  author: { _id: string; name: string; image?: string; email?: string; };
  category: string; tags: string[]; metaTitle: string;
  metaDescription: string; views: number; createdAt: string; updatedAt: string;
}

interface Pagination { total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrev: boolean; }
interface BlogsResponse { success: boolean; blogs: Blog[]; pagination: Pagination; }
interface BlogResponse { success: boolean; blog: Blog; }
interface BlogParams { category?: string; search?: string; page?: number; limit?: number; }
interface CreateBlogPayload {
  title: string; excerpt: string; content: string; coverImage?: string;
  category?: string; tags?: string[]; author: string;
  metaTitle?: string; metaDescription?: string; metaKeywords?: string[]; ogImage?: string;
}

export const blogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. ADMIN - normal pagination (no merge)
    getBlogs: builder.query<BlogsResponse, BlogParams | void>({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params?.category && params.category!== "All") sp.append("category", params.category);
        if (params?.search) sp.append("search", params.search);
        if (params?.page) sp.append("page", params.page.toString());
        if (params?.limit) sp.append("limit", params.limit.toString());
        const qs = sp.toString();
        return `/blogs${qs? `?${qs}` : ""}`;
      },
      providesTags: ["Blog"],
      keepUnusedDataFor: 60,
    }),

    // 2. PUBLIC - infinite scroll (with merge)
    getBlogsInfinite: builder.query<BlogsResponse, BlogParams | void>({
      serializeQueryArgs: ({ queryArgs }) => {
        const cat = queryArgs?.category || "All";
        const search = queryArgs?.search || "";
        return `blogs-infinite-${cat}-${search}`;
      },
      query: (params) => {
        const sp = new URLSearchParams();
        if (params?.category && params.category!== "All") sp.append("category", params.category);
        if (params?.search) sp.append("search", params.search);
        if (params?.page) sp.append("page", params.page.toString());
        if (params?.limit) sp.append("limit", params.limit.toString());
        const qs = sp.toString();
        return `/blogs${qs? `?${qs}` : ""}`;
      },
      merge: (currentCache, newData) => {
        if (newData.pagination.currentPage === 1) return newData;
        currentCache.blogs.push(...newData.blogs);
        currentCache.pagination = newData.pagination;
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.page!== previousArg?.page ||
               currentArg?.search!== previousArg?.search ||
               currentArg?.category!== previousArg?.category;
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

export const {
  useGetBlogsQuery, // use for ADMIN
  useGetBlogsInfiniteQuery, // use for PUBLIC
  useGetBlogBySlugQuery,
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
} = blogApi;