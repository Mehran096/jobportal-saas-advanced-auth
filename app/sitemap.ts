import { MetadataRoute } from "next";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://jobportal-saas-advanced-auth.vercel.app";

  const staticPages = ["", "/blog", "/jobs"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 1,
  }));

  await dbConnect();
  const blogs = await Blog.find({ status: "published" }).select("slug updatedAt").lean();
  
  const blogPages = blogs.map((blog: { slug: string; updatedAt?: Date }) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.updatedAt ? new Date(blog.updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...blogPages];
}