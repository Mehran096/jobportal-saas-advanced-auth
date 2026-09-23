"use client";
export const dynamic = 'force-dynamic';

import Link from "next/link";
import DashboardHeader from "@/app/components/DashboardHeader";
import { useGetSavedJobsQuery, useUnsaveJobMutation, type Job } from "@/lib/redux/api/jobseekerApi";
import { Bookmark, MapPin, DollarSign, Briefcase, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function SavedJobsPage() {
  const { data, isLoading } = useGetSavedJobsQuery();
  const [unsaveJob] = useUnsaveJobMutation();

  const savedJobs: Job[] = data?.savedJobs || [];

  const handleUnsave = async (jobId: string) => {
    try {
      await unsaveJob(jobId).unwrap();
      toast.success("Removed from saved");
    } catch {
      toast.error("Failed to unsave");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* <DashboardHeader /> */}
        <div className="max-w-7xl mx-auto p-6 flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <DashboardHeader /> */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bookmark className="text-blue-600" /> Saved Jobs
          </h1>
          <p className="text-gray-600 mt-1">{savedJobs.length} jobs saved</p>
        </div>

        {savedJobs.length === 0? (
          <div className="bg-white rounded-xl shadow border p-12 text-center">
            <Briefcase className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="font-semibold text-gray-900 mb-2">No saved jobs yet</h3>
            <p className="text-sm text-gray-500 mb-5">Save jobs to apply later — they will appear here</p>
            <Link href="/dashboard/jobs" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedJobs.map((job) => (
              <div key={job._id} className="bg-white p-6 rounded-xl shadow border hover:shadow-md transition flex flex-col">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1 line-clamp-1">{job.title}</h3>
                  <p className="text-gray-700 text-sm font-medium mb-3">{job.company}</p>
                  <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2"><MapPin size={14} /> {job.location}</div>
                    <div className="flex items-center gap-2"><DollarSign size={14} /> {job.salary}</div>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">{job.description?? ""}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/jobs/${job._id}`} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 rounded-lg font-medium text-sm">
                    View Details
                  </Link>
                  <button onClick={() => handleUnsave(job._id)} className="px-3 py-2.5 border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}