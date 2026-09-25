"use client";
export const dynamic = 'force-dynamic';

import Link from "next/link";
import DashboardHeader from "@/app/components/DashboardHeader";
import { useGetSavedJobsQuery, useUnsaveJobMutation, type Job } from "@/lib/redux/api/jobseekerApi";
import { Bookmark, MapPin, Briefcase, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";

export default function SavedJobsPage() {
  const { data, isLoading } = useGetSavedJobsQuery();
  const [unsaveJob] = useUnsaveJobMutation();
  const savedJobs: Job[] = data?.savedJobs || [];

  const handleUnsave = async (e: React.MouseEvent, jobId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await unsaveJob(jobId).unwrap();
      toast.success("Removed from saved");
    } catch {
      toast.error("Failed to unsave");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white sm:bg-gray-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto p-3 sm:p-6 flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={28} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white sm:bg-gray-50">
      <DashboardHeader />
      {/* ✅ compact on mobile, no p-4 border heavy */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pb-24 sm:pb-6 pt-3 sm:pt-6">
        <div className="mb-3 sm:mb-6">
          <h1 className="text-[19px] sm:text-3xl font-bold flex items-center gap-2 leading-tight">
            <Bookmark className="text-blue-600" size={20} /> Saved Jobs
          </h1>
          <p className="text-[12px] sm:text-[15px] text-gray-500 mt-0.5">{savedJobs.length} jobs saved</p>
        </div>

        {savedJobs.length === 0? (
          <div className="bg-white sm:border sm:rounded-xl sm:shadow-sm p-8 sm:p-12 text-center mt-4">
            <Briefcase className="mx-auto text-gray-300 mb-3" size={36} />
            <h3 className="font-semibold text-[14px] sm:text-base">No saved jobs yet</h3>
            <p className="text-[12px] sm:text-sm text-gray-500 mt-1 mb-4">Save jobs to apply later</p>
            <Link href="/dashboard/jobs" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-[13px] font-semibold">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {savedJobs.map((job) => (
              <Link
                key={job._id}
                href={`/dashboard/jobs/${job._id}`}
                className="bg-white p-4 sm:p-5 border border-gray-200 sm:border-gray-100 rounded-xl shadow-sm hover:shadow-md transition flex flex-col group"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-[14px] sm:text-[15px] font-semibold line-clamp-1 group-hover:text-blue-600 leading-snug">{job.title}</h3>
                    <button onClick={(e) => handleUnsave(e, job._id)} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-gray-700 font-medium mb-2 truncate">{job.company}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border text-[11px] text-gray-600"><MapPin size={10} /> <span className="truncate max-w-25">{job.location}</span></span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-[11px] font-medium">Rs. {Number(job.salary).toLocaleString("en-PK")}</span>
                  </div>
                  <p className="text-[12px] text-gray-500 line-clamp-2 leading-[1.4]">{job.description?? ""}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="flex-1 py-2 rounded-lg bg-blue-600 group-hover:bg-blue-700 text-white text-center text-[12px] font-semibold transition">View Details</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <DashboardMobileNav />
    </div>
  );
}