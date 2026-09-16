"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateJobMutation } from "@/lib/redux/api/employerApi";
import { ArrowLeft, Briefcase, Loader2 } from "lucide-react";

export default function PostJobPage() {
  const router = useRouter();
  const [createJob, { isLoading }] = useCreateJobMutation();

  const [form, setForm] = useState({
    title: "", 
    company: "", 
    location: "", 
    salary: "", 
    description: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createJob(form).unwrap();
      alert("Job posted successfully!");
      router.push("/dashboard/employer/jobs");
    } catch (err: any) {
      console.error(err);
      alert(err.data?.message || "Failed to post job");
    }
  }

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post New Job</h1>
          <p className="text-gray-500 text-sm">Fill the details to publish your job listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border space-y-5">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
          <input 
            type="text" 
            name="title"
            placeholder="e.g. Senior React Developer" 
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            value={form.title} 
            onChange={handleChange} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input 
              type="text" 
              name="company"
              placeholder="e.g. Google" 
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={form.company} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input 
              type="text" 
              name="location"
              placeholder="e.g. Remote, Lahore, PK" 
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={form.location} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
          <input 
            type="text" 
            name="salary"
            placeholder="e.g. 50,000 - 80,000 PKR / month" 
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            value={form.salary} 
            onChange={handleChange} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
          <textarea 
            name="description"
            placeholder="Describe responsibilities, requirements, benefits..." 
            rows={6} 
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            value={form.description} 
            onChange={handleChange} 
          />
        </div>

        <button 
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:bg-gray-400 transition"
        >
          {isLoading? <Loader2 size={18} className="animate-spin" /> : <Briefcase size={18} />}
          {isLoading? "Posting Job..." : "Post Job"}
        </button>
      </form>
    </div>
  );
}