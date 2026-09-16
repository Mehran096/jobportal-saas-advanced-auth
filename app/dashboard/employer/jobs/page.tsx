"use client";
export const dynamic = 'force-dynamic';

import Link from "next/link";
import DashboardHeader from "@/app/components/DashboardHeader"; // <-- ADD THIS
import { 
  useGetMyJobsQuery, 
  useDeleteJobMutation 
} from "@/lib/redux/api/employerApi";
import { Trash2, Edit, Users, Plus, MapPin, DollarSign, Calendar, Briefcase, Eye } from "lucide-react";

const JobCardSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="flex gap-4 mb-4">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </div>
    <div className="flex gap-2">
      <div className="h-9 bg-gray-200 rounded w-28"></div>
      <div className="h-9 bg-gray-200 rounded w-20"></div>
      <div className="h-9 bg-gray-200 rounded w-20"></div>
    </div>
  </div>
);

export default function MyJobsPage() {
  const { data, isLoading, isError } = useGetMyJobsQuery();
  const jobs = data?.jobs || [];
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;
    
    try {
      await deleteJob(id).unwrap();
    } catch (err: any) {
      console.error(err);
      alert(err.data?.message || "Delete failed");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader /> {/* <-- ADD HEADER HERE TOO */}
        <div className="max-w-6xl mx-auto p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1,2,3,4,5,6].map(i => <JobCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (isError) return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="p-6 text-center text-red-500">Failed to load jobs. Please try again.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader /> {/* <-- ADD HEADER HERE */}

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Posted Jobs</h1>
            <p className="text-gray-500 mt-1">Manage all your job listings in one place</p>
          </div>
          <Link 
            href="/dashboard/employer/post-job"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition shadow-sm"
          >
            <Plus size={18} /> Post New Job
          </Link>
        </div>

        {/* Empty State */}
        {jobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
            <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Briefcase size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs posted yet</h3>
            <p className="text-gray-500 mb-6">Start hiring by posting your first job listing</p>
            <Link 
              href="/dashboard/employer/post-job"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium inline-flex items-center gap-2"
            >
              <Plus size={18} /> Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  {/* Job Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 text-sm mb-3">
                      <span className="flex items-center gap-1.5">
                        <Briefcase size={14} /> {job.company}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} /> {job.location}
                      </span>
                      <span className="flex items-center gap-1.5 text-green-700 font-medium">
                        <DollarSign size={14} /> {job.salary}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <Calendar size={14} /> Posted {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                        <Users size={14} /> {job.applicationCount ?? 0} Applicants
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Link
                      href={`/dashboard/employer/jobs/${job._id}`}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye size={14} /> View
                    </Link>
                    
                    <Link
                      href={`/dashboard/employer/applicants?jobId=${job._id}`}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium text-center transition"
                    >
                      Applicants
                    </Link>
                    
                    <Link
                      href={`/dashboard/employer/jobs/${job._id}/edit`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition"
                    >
                      <Edit size={14} /> Edit
                    </Link>

                    <button
                      onClick={() => handleDelete(job._id)}
                      disabled={isDeleting}
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}