"use client";
import { useGetBlogsQuery, useDeleteBlogMutation } from "@/lib/redux/api/blogApi";
import Link from "next/link";
import { useState } from "react";

export default function AdminBlogsPage() {
  const { data, isLoading, refetch } = useGetBlogsQuery();
  const [deleteBlog] = useDeleteBlogMutation();
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const handleDelete = async (slug: string) => {
    if (!confirm("Kya aap is blog ko delete karna chahte ho?")) return;
    try {
      setDeletingSlug(slug);
      await deleteBlog(slug).unwrap();
      refetch();
    } catch (err) {
        console.error(err);
      alert("Delete failed");
    } finally {
      setDeletingSlug(null);
    }
  };

  if (isLoading) return <div className="p-6">Loading blogs...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Blog Management</h1>
        <Link href="/dashboard/admin/blogs/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + New Blog
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">Title</th>
              <th className="text-left p-3 text-sm font-semibold">Category</th>
              <th className="text-left p-3 text-sm font-semibold">Views</th>
              <th className="text-left p-3 text-sm font-semibold">Date</th>
              <th className="text-left p-3 text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {data?.blogs?.map((blog) => (
              <tr key={blog._id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium line-clamp-1">{blog.title}</div>
                  <div className="text-xs text-gray-500">{blog.slug}</div>
                </td>
                <td className="p-3"><span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{blog.category}</span></td>
                <td className="p-3 text-sm">{blog.views}</td>
                <td className="p-3 text-sm">{new Date(blog.createdAt).toLocaleDateString()}</td>
                <td className="p-3 flex gap-2">
                  <Link href={`/dashboard/admin/blogs/view/${blog.slug}`} className="text-blue-600 text-sm hover:underline">View</Link>
                  <Link href={`/dashboard/admin/blogs/edit/${blog.slug}`} className="text-green-600 text-sm hover:underline">Edit</Link>
                  <button onClick={() => handleDelete(blog.slug)} disabled={deletingSlug === blog.slug} className="text-red-600 text-sm hover:underline disabled:opacity-50">
                    {deletingSlug === blog.slug? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {(!data?.blogs || data.blogs.length === 0) && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No blogs found. Create one!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}