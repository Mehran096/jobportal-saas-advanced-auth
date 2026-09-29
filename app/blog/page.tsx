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
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2">Career Blog</h1>
        <p className="text-gray-600 text-sm md:text-base">Latest guides for jobs in Pakistan 2026</p>
      </div>

      {blogs.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border">
          <p className="text-gray-500">No blogs published yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {blogs.map((blog) => (
          <Link
            key={blog.slug}
            href={`/blog/${blog.slug}`}
            className="border rounded-xl overflow-hidden hover:shadow-lg transition bg-white group"
          >
            <div className="relative w-full h-48 md:h-48">
              <Image
                src={blog.coverImage}
                alt={blog.title}
                fill
                className="object-cover group-hover:scale-105 transition duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] md:text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                  {blog.category}
                </span>
                <span className="text-[11px] text-gray-400">👁️ {blog.views}</span>
              </div>
              <h2 className="font-semibold mt-3 line-clamp-2 text-[15px] md:text-base leading-snug group-hover:text-blue-600 transition">
                {blog.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                {blog.excerpt}
              </p>
              <p className="text-xs text-gray-400 mt-3">
                {new Date(blog.createdAt).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}