export const revalidate = 60;

import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Career Guides & Job Tips 2026 | Job Portal",
  description: "Latest CV tips, interview guides, and career advice for Pakistani students.",
};

interface BlogLean {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  category: string;
  views: number;
  createdAt: Date;
}

export default async function BlogListPage() {
  await dbConnect();
  const blogs = (await Blog.find({ status: "published" })
   .sort({ createdAt: -1 })
   .lean()) as unknown as BlogLean[];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-2">Career Blog</h1>
      <p className="text-gray-600 mb-8">Latest guides for jobs in Pakistan 2026</p>

      <div className="grid md:grid-cols-3 gap-6">
        {blogs.map((blog) => (
          <Link key={blog.slug} href={`/blog/${blog.slug}`} className="border rounded-xl overflow-hidden hover:shadow-lg transition">
            <div className="relative w-full h-48">
              <Image src={blog.coverImage} alt={blog.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
            </div>
            <div className="p-4">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{blog.category}</span>
              <h2 className="font-semibold mt-2 line-clamp-2">{blog.title}</h2>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{blog.excerpt}</p>
              <p className="text-xs text-gray-400 mt-3">👁️ {blog.views} views</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}