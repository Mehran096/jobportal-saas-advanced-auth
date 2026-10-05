"use client";
import { useGetBlogsQuery, useDeleteBlogMutation } from "@/lib/redux/api/blogApi";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function AdminBlogsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, refetch } = useGetBlogsQuery({ search, page, limit });
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

  const totalPages = data?.pagination?.totalPages || 1;
  const total = data?.pagination?.total || 0;
  const isSearching = isFetching &&!isLoading;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* HEADER + SEARCH */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Blog Management</h1>
          <p className="text-sm text-gray-500">{isSearching? "Searching..." : `${total} blogs total`}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto relative">
          <div className="relative flex-1 md:w-75">
            <input
              type="text"
              placeholder="Search title, category, tags..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            />
            {isSearching && (
              <span className="absolute right-3 top-2.5 text-gray-400 animate-spin">⏳</span>
            )}
          </div>
          <Link href="/dashboard/admin/blogs/create" className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap">
            + New Blog
          </Link>
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden relative">
        {/* Loading overlay for pagination/search */}
        {isSearching && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="bg-white px-4 py-2 rounded-lg shadow border text-sm">Loading...</div>
          </div>
        )}
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
          <tbody className={isSearching? "opacity-50" : ""}>
            {data?.blogs?.map((blog) => (
              <tr key={blog._id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium line-clamp-1 max-w-87.5">{blog.title}</div>
                  <div className="text-xs text-gray-500 truncate">{blog.slug}</div>
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
          </tbody>
        </table>
        {(!data?.blogs || data.blogs.length === 0) &&!isSearching && (
          <div className="p-6 text-center text-gray-500">No blogs found. Try different search!</div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t bg-gray-50">
            <p className="text-sm text-gray-600">Page {page} of {totalPages} • {total} blogs</p>
            <div className="flex gap-1">
              <button disabled={page === 1 || isFetching} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-sm">Previous</button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} disabled={isFetching} className={`px-3 py-1 border rounded text-sm disabled:opacity-50 ${page === i + 1? 'bg-black text-white border-black' : 'bg-white'}`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page === totalPages || isFetching} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-sm">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-4 relative">
        {isSearching && (
          <div className="flex justify-center py-2">
            <span className="text-sm text-gray-500 animate-pulse">Searching blogs...</span>
          </div>
        )}
        <div className={isSearching? "opacity-50 space-y-4" : "space-y-4"}>
          {data?.blogs?.map((blog) => (
            <div key={blog._id} className="bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-semibold text-[14px] line-clamp-2 leading-snug">{blog.title}</h3>
              <p className="text-[11px] text-gray-400 mt-1 truncate">{blog.slug}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded-full">{blog.category}</span>
                <span className="text-xs text-gray-500">{blog.views} Views • {new Date(blog.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <Link href={`/dashboard/admin/blogs/view/${blog.slug}`} className="text-center bg-gray-100 py-2 rounded-lg text-sm font-medium">View</Link>
                <Link href={`/dashboard/admin/blogs/edit/${blog.slug}`} className="text-center bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">Edit</Link>
                <button onClick={() => handleDelete(blog.slug)} disabled={deletingSlug === blog.slug} className="bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {deletingSlug === blog.slug? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
        {(!data?.blogs || data.blogs.length === 0) &&!isSearching && (
          <div className="bg-white p-6 text-center rounded-xl text-gray-500 text-sm">No blogs found.</div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-2">
            <button disabled={page === 1 || isFetching} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 border rounded-lg bg-white disabled:opacity-50 text-sm">Prev</button>
            <span className="text-sm font-medium">{isFetching? "Loading..." : `Page ${page} / ${totalPages}`}</span>
            <button disabled={page === totalPages || isFetching} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 border rounded-lg bg-white disabled:opacity-50 text-sm">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}