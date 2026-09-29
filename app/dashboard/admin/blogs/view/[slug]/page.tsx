"use client";
import { useParams, useRouter } from "next/navigation";
import { useGetBlogBySlugQuery } from "@/lib/redux/api/blogApi";
import Link from "next/link";
import Image from "next/image";

export default function AdminBlogViewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const { data, isLoading, isError } = useGetBlogBySlugQuery(slug);

  if (isLoading) return <div className="p-10 text-center">Loading blog...</div>;
  if (isError || !data?.blog) return <div className="p-10 text-center text-red-500">Blog not found</div>;

  const blog = data.blog;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <button onClick={() => router.back()} className="px-3 md:px-4 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50">
          ← Back
        </button>
        <Link href={`/dashboard/admin/blogs/edit/${blog.slug}`} className="px-4 md:px-6 py-2 bg-black text-white rounded-lg text-sm font-medium">
          Edit Blog
        </Link>
      </div>

      {/* COVER IMAGE - Fixed with next/image */}
      {blog.coverImage && (
        <div className="relative w-full h-55 md:h-100 mb-4 md:mb-6">
          <Image
            src={blog.coverImage}
            alt={blog.title}
            fill
            className="object-cover rounded-xl"
            sizes="(max-width: 768px) 100vw, 900px"
          />
        </div>
      )}

      {/* META */}
      <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs md:text-sm">{blog.category}</span>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs md:text-sm">👁️ {blog.views} views</span>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs md:text-sm">
          {new Date(blog.createdAt).toLocaleDateString()}
        </span>
      </div>

      <h1 className="text-xl md:text-3xl font-bold mb-2 md:mb-3 leading-tight">{blog.title}</h1>
      <p className="text-gray-600 text-sm md:text-lg mb-4 md:mb-6">{blog.excerpt}</p>

      <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
        {blog.tags?.map((tag: string) => (
          <span key={tag} className="px-2 py-1 bg-gray-100 border text-xs md:text-sm rounded">#{tag}</span>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 md:p-6 border shadow-sm">
        <div
          className="prose prose-sm md:prose-lg max-w-none 
          prose-h2:text-xl md:prose-h2:text-2xl prose-h2:font-bold 
          prose-p:leading-7 prose-p:text-gray-700
          prose-img:rounded-xl prose-img:w-full"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </div>

      <div className="md:hidden mt-6 grid grid-cols-2 gap-3">
        <button onClick={() => router.back()} className="py-3 border rounded-xl text-sm font-medium bg-white">Go Back</button>
        <Link href={`/dashboard/admin/blogs/edit/${blog.slug}`} className="py-3 bg-black text-white rounded-xl text-sm font-medium text-center">Edit</Link>
      </div>
    </div>
  );
}