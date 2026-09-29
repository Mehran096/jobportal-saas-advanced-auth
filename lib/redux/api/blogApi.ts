import { baseApi } from "./baseApi";

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: {
    _id: string;
    name: string;
    image?: string;
    email?: string;
  };
  category: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface BlogsResponse {
  success: boolean;
  blogs: Blog[];
}

interface BlogResponse {
  success: boolean;
  blog: Blog;
}

interface BlogParams {
  category?: string;
  search?: string;
}

export const blogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET all blogs
    getBlogs: builder.query<BlogsResponse, BlogParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.category) searchParams.append("category", params.category);
        if (params?.search) searchParams.append("search", params.search);
        const queryString = searchParams.toString();
        return `/blogs${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Blog"],
    }),

    // GET single blog by slug
    getBlogBySlug: builder.query<BlogResponse, string>({
      query: (slug) => `/blogs/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Blog", id: slug }],
    }),

    // POST create blog (admin)
    createBlog: builder.mutation<BlogResponse, { title: string; excerpt: string; content: string; coverImage?: string; category?: string; tags?: string[]; author: string }>({
      query: (body) => ({
        url: "/blogs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Blog"],
    }),

    // PUT update blog
    updateBlog: builder.mutation<BlogResponse, { slug: string; data: Partial<Blog> }>({
      query: ({ slug, data }) => ({
        url: `/blogs/${slug}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { slug }) => [{ type: "Blog", id: slug }, "Blog"],
    }),

    // DELETE blog
    deleteBlog: builder.mutation<{ success: boolean; message: string }, string>({
      query: (slug) => ({
        url: `/blogs/${slug}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Blog"],
    }),
  }),
});

export const {
  useGetBlogsQuery,
  useGetBlogBySlugQuery,
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
} = blogApi;