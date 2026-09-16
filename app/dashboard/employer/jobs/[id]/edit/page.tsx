"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetJobByIdQuery, useUpdateJobMutation } from "@/lib/redux/api/employerApi";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function EditJobPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // 1. Fetch job with RTK
  const { data, isLoading, isError } = useGetJobByIdQuery(id);
  const job = data?.job;

  // 2. Update mutation
  const [updateJob, { isLoading: isSubmitting }] = useUpdateJobMutation();

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    description: ""
  });

  // Populate form when job data loads
  useEffect(() => {
    if (job) {
      setForm({
        title: job.title || "",
        company: job.company || "",
        location: job.location || "",
        salary: job.salary || "",
        description: job.description || ""
      });
    }
  }, [job]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({...form, [e.target.name]: e.target.value });
  };

  // 3. Submit with RTK mutation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateJob({ id, data: form }).unwrap();
      alert("Job updated successfully!");
      router.push("/dashboard/employer/jobs");
    } catch (err: any) {
      console.error(err);
      alert(err.data?.message || "Update failed");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4 animate-pulse">
          {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-gray-200 rounded"></div>)}
        </div>
      </div>
    );
  }

  if (isError ||!job) return <div className="p-6 text-center text-red-500">Job not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
          <input
            name="salary"
            value={form.salary}
            onChange={handleChange}
            required
            placeholder="e.g. 50,000 - 80,000 PKR"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={6}
            className="w-full border-gray-300 border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:bg-gray-400 transition"
          >
            {isSubmitting? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSubmitting? "Updating..." : "Update Job"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}