"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateJobMutation } from "@/lib/redux/api/employerApi";
import { ArrowLeft, Briefcase, Loader2 } from "lucide-react";

type FormState = {
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  description: string;
};

export default function PostJobPage() {
  const router = useRouter();
  const [createJob, { isLoading }] = useCreateJobMutation();

  const [form, setForm] = useState<FormState>({
    title: "",
    company: "",
    location: "",
    salary: "",
    type: "Full-time",
    description: ""
  });

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
      await createJob({
        title: form.title,
        company: form.company,
        location: form.location,
        type: form.type,
        description: form.description,
        salary: salaryNumber,
      }).unwrap();
      router.push("/dashboard/employer/jobs");
    } catch (err: unknown) {
      const message = err instanceof Error? err.message : "Failed to post job";
      alert(message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post New Job</h1>
          <p className="text-gray-500 text-sm">Fill the details to publish your job listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
          <input type="text" name="title" placeholder="e.g. Senior React Developer" required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={form.title} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input type="text" name="company" placeholder="e.g. ITBS" required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={form.company} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input type="text" name="location" placeholder="e.g. Remote, Lahore, PK" required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={form.location} onChange={handleChange} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
            <select name="type" required className="w-full border rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={form.type} onChange={handleChange}>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Remote">Remote</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Salary (Rs. / month)</label>
            <input type="number" name="salary" placeholder="e.g. 100000" required min={1} className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={form.salary} onChange={handleChange} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
          <textarea name="description" placeholder="Describe responsibilities..." rows={6} required className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={form.description} onChange={handleChange} />
        </div>

        <button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:bg-gray-400 transition">
          {isLoading? <Loader2 size={18} className="animate-spin" /> : <Briefcase size={18} />}
          {isLoading? "Posting Job..." : "Post Job"}
        </button>
      </form>
    </div>
  );
}