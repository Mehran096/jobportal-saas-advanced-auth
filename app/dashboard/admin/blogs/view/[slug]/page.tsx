"use client";
import { useParams, useRouter } from "next/navigation";
import { useGetBlogBySlugQuery } from "@/lib/redux/api/blogApi"; // aapka hook - naam check kar lena
import Link from "next/link";

export default function AdminBlogViewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const { data, isLoading, isError } = useGetBlogBySlugQuery(slug);

  if (isLoading) return <div className="p-10 text-center">Loading blog...</div>;
  if (isError ||!data?.blog) return <div className="p-10 text-center text-red-500">Blog not found</div>;

  const blog = data.blog;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="px-4 py-2 border rounded-lg">← Back</button>
        <Link href={`/dashboard/admin/blogs/edit/${blog.slug}`} className="px-4 py-2 bg-black text-white rounded-lg">Edit</Link>
      </div>

      {blog.coverImage && (
        <img src={blog.coverImage} alt={blog.title} className="w-full h-[400px] object-cover rounded-xl mb-6" />
      )}

      <div className="flex gap-2 mb-4">
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{blog.category}</span>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">👁️ {blog.views} views</span>
      </div>

      <h1 className="text-3xl font-bold mb-3">{blog.title}</h1>
      <p className="text-gray-600 text-lg mb-6">{blog.excerpt}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {blog.tags?.map((tag: string) => (
          <span key={tag} className="px-2 py-1 bg-gray-100 border text-sm rounded">#{tag}</span>
        ))}
      </div>

      <div
        className="prose prose-lg max-w-none prose-h2:text-2xl prose-h2:font-bold prose-p:leading-7"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </div>
  );
}