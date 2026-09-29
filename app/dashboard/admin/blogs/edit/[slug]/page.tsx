"use client";
import { useGetBlogBySlugQuery, useUpdateBlogMutation } from "@/lib/redux/api/blogApi";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function EditBlogPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const { data, isLoading: isFetching } = useGetBlogBySlugQuery(slug);
  const [updateBlog, { isLoading: isUpdating }] = useUpdateBlogMutation();

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    coverImage: "",
    category: "Career Guide",
    tags: "",
  });

  useEffect(() => {
    if (data?.blog) {
      setForm({
        title: data.blog.title || "",
        excerpt: data.blog.excerpt || "",
        content: data.blog.content || "",
        coverImage: data.blog.coverImage || "",
        category: data.blog.category || "Career Guide",
        tags: data.blog.tags?.join(", ") || "",
      });
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateBlog({
        slug,
        data: {
          title: form.title,
          excerpt: form.excerpt,
          content: form.content,
          coverImage: form.coverImage,
          category: form.category,
          tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) as never,
        } as never,
      }).unwrap();
      alert("Blog updated!");
      router.push("/dashboard/admin/blogs");
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  if (isFetching) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Edit Blog</h1>
      <p className="text-sm text-gray-500 mb-6">Editing: {slug}</p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow">
        <input className="w-full border p-3 rounded" placeholder="Blog Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
        <textarea className="w-full border p-3 rounded" placeholder="Excerpt" rows={3} value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} required />
        <input className="w-full border p-3 rounded" placeholder="Cover Image URL" value={form.coverImage} onChange={e => setForm({...form, coverImage: e.target.value})} />
        <div className="grid grid-cols-2 gap-4">
          <select className="border p-3 rounded" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            <option>Career Guide</option>
            <option>Interview Tips</option>
            <option>Tech News</option>
            <option>Freelancing</option>
            <option>CV & Resume</option>
            <option>Job Market</option>
          </select>
          <input className="w-full border p-3 rounded" placeholder="Tags comma separated" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
        </div>
        <textarea className="w-full border p-3 rounded font-mono text-sm" placeholder="HTML Content" rows={18} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required />
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="flex-1 border p-3 rounded-lg">Cancel</button>
          <button type="submit" disabled={isUpdating} className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:opacity-50">
            {isUpdating? "Updating..." : "Update Blog"}
          </button>
        </div>
      </form>
    </div>
  );
}