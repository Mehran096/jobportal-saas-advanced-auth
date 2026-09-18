"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetJobByIdQuery, useUpdateJobMutation } from "@/lib/redux/api/employerApi";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

type FormState = {
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  description: string;
};

export default function EditJobPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useGetJobByIdQuery(id);
  const job = data?.job;

  const [updateJob, { isLoading: isSubmitting }] = useUpdateJobMutation();

  const [form, setForm] = useState<FormState>({
    title: "",
    company: "",
    location: "",
    salary: "",
    type: "Full-time",
    description: ""
  });

  useEffect(() => {
    if (job) {
      setForm({
        title: job.title || "",
        company: job.company || "",
        location: job.location || "",
        salary: job.salary? String(job.salary) : "",
        type: job.type || "Full-time",
        description: job.description || ""
      });
    }
  }, [job]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const salaryNumber = Number(form.salary);
    if (!salaryNumber || salaryNumber <= 0) {
      alert("Please enter valid salary in Rs.");
      return;
    }

    try {
      await updateJob({
        id,
        data: {
          title: form.title,
          company: form.company,
          location: form.location,
          type: form.type,
          description: form.description,
          salary: salaryNumber,
        },
      }).unwrap();
      router.push("/dashboard/employer/jobs");
    } catch (err: unknown) {
      const message = err instanceof Error? err.message : "Update failed";
      alert(message);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4 animate-pulse">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-10 bg-gray-200 rounded"></div>)}
        </div>
      </div>
    );
  }

  if (isError ||!job) return <div className="p-6 text-center text-red-500">Job not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
          <input name="title" value={form.title} onChange={handleChange} required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <input name="company" value={form.company} onChange={handleChange} required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input name="location" value={form.location} onChange={handleChange} required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
            <select name="type" value={form.type} onChange={handleChange} required className="w-full border rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Remote">Remote</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Salary (Rs. / month)</label>
            <input type="number" name="salary" value={form.salary} onChange={handleChange} required min={1} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} required rows={6} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:bg-gray-400 transition">
            {isSubmitting? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSubmitting? "Updating..." : "Update Job"}
          </button>
          <button type="button" onClick={() => router.back()} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}