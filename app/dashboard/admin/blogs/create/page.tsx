"use client";
import { useCreateBlogMutation } from "@/lib/redux/api/blogApi";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateBlogPage() {
  const router = useRouter();
  const [createBlog, { isLoading }] = useCreateBlogMutation();

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    coverImage: "",
    category: "Career Guide",
    tags: "",
    author: "" // yahan admin ID dalna hai
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage,
        category: form.category,
        author: "6ab4f2465b950a0a736a163d",
        tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) as string[],
      };

      await createBlog(payload).unwrap();
      alert("Blog created!");
      router.push("/dashboard/admin/blogs");
    } catch (err) {
      console.error(err);
      alert("Failed to create blog");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Blog</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow">
        <input className="w-full border p-3 rounded" placeholder="Blog Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
        <textarea className="w-full border p-3 rounded" placeholder="Excerpt (short description)" rows={3} value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} required />
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
        {/* <input className="w-full border p-3 rounded" placeholder="Author ID (MongoDB ID)" value={form.author} onChange={e => setForm({...form, author: e.target.value})} required /> */}
        <input className="w-full border p-3 rounded bg-gray-100" value={form.author} readOnly />
        <textarea className="w-full border p-3 rounded font-mono text-sm" placeholder="HTML Content" rows={15} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required />
        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isLoading ? "Creating..." : "Publish Blog"}
        </button>
      </form>
    </div>
  );
}