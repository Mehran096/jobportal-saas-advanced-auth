"use client";
export const dynamic = 'force-dynamic';

import Link from "next/link";
import DashboardHeader from "@/app/components/DashboardHeader";
import { useGetMyJobsQuery, useDeleteJobMutation } from "@/lib/redux/api/employerApi";
import { Trash2, Edit, Users, Plus, MapPin, Calendar, Briefcase, Eye } from "lucide-react";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";

const JobCardSkeleton = () => (
  <div className="bg-white p-4 rounded-xl border animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
    <div className="flex gap-2 mb-3">
      <div className="h-3 bg-gray-200 rounded w-16"></div>
      <div className="h-3 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="h-8 bg-gray-200 rounded"></div>
      <div className="h-8 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export default function MyJobsPage() {
  const { data, isLoading, isError } = useGetMyJobsQuery();
  const jobs = data?.jobs?? [];
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    try {
      await deleteJob(id).unwrap();
    } catch (err: unknown) {
      const message = err instanceof Error? err.message : "Delete failed";
      alert(message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white sm:bg-gray-50">
        <DashboardHeader />
        <div className="max-w-6xl mx-auto p-3 sm:p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[1,2,3,4].map((i) => <JobCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (isError) return (
    <div className="min-h-screen bg-white sm:bg-gray-50">
      <DashboardHeader />
      <div className="p-6 text-center text-red-500 text-[13px]">Failed to load jobs.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white sm:bg-gray-50">
      <DashboardHeader />
      <main className="max-w-6xl mx-auto pb-24 sm:pb-6 p-3 sm:p-6">
        {/* Header compact */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <div>
            <h1 className="text-[18px] sm:text-[24px] font-bold text-gray-900 leading-tight">My Posted Jobs</h1>
            <p className="text-gray-500 text-[11px] sm:text-[13px] mt-1">{jobs.length} listings</p>
          </div>
          <Link href="/dashboard/employer/post-job" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-medium flex items-center gap-1.5 text-[12px] sm:text-[13px] shadow-sm">
            <Plus size={14} /> Post New Job
          </Link>
        </div>

        {jobs.length === 0? (
          <div className="text-center py-10 sm:py-16 bg-white rounded-2xl border border-gray-100">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
              <Briefcase size={22} />
            </div>
            <h3 className="text-[14px] sm:text-[18px] font-semibold text-gray-900 mb-1">No jobs posted yet</h3>
            <p className="text-gray-500 text-[12px] sm:text-[13px] mb-4">Start hiring by posting first job</p>
            <Link href="/dashboard/employer/post-job" className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium inline-flex items-center gap-1.5 text-[12px]">
              <Plus size={14} /> Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white p-3.5 sm:p-6 rounded-2xl border border-gray-200 sm:shadow-sm hover:shadow-md transition">
                <div className="flex flex-col gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-[14px] sm:text-[17px] font-bold text-gray-900 leading-tight line-clamp-2 flex-1">{job.title}</h3>
                      {job.type && <span className="shrink-0 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] sm:text-[11px] font-medium border border-blue-100">{job.type}</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-x-3 sm:gap-y-2 text-[11px] sm:text-[13px] mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border text-gray-600"><Briefcase size={10} /> <span className="truncate max-w-22.5 sm:max-w-none">{job.company}</span></span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border text-gray-600"><MapPin size={10} /> {job.location}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-100 text-green-700 font-semibold">Rs. {Number(job.salary).toLocaleString("en-PK")}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-[12px]">
                      <span className="flex items-center gap-1 text-gray-500"><Calendar size={11} /> {new Date(job.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold border border-blue-100"><Users size={11} /> {job.applicationCount?? 0}</span>
                    </div>
                  </div>

                  {/* Buttons - compact 2x2 on mobile */}
                  <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 sm:gap-2 mt-1">
                    <Link href={`/dashboard/employer/jobs/${job._id}`} className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-1 py-2 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-[13px] font-semibold flex items-center justify-center gap-1 transition">
                      <Eye size={12} /> <span className="hidden sm:inline">View</span><span className="sm:hidden">View</span>
                    </Link>
                    <Link href={`/dashboard/employer/applicants?jobId=${job._id}`} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-1 py-2 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-[13px] font-semibold flex items-center justify-center transition">
                      Apps
                    </Link>
                    <Link href={`/dashboard/employer/jobs/${job._id}/edit`} className="bg-gray-50 hover:bg-gray-100 text-gray-700 border px-1 py-2 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-[13px] font-semibold flex items-center justify-center gap-1 transition">
                      <Edit size={12} /> Edit
                    </Link>
                    <button onClick={() => handleDelete(job._id)} disabled={isDeleting} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-1 py-2 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-[13px] font-semibold flex items-center justify-center gap-1 transition disabled:opacity-50">
                      <Trash2 size={12} /> Del
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <DashboardMobileNav />
    </div>
  );
}