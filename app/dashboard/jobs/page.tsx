"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/app/components/DashboardHeader";
import {
  useGetAllJobsQuery,
  useGetMyApplicationsQuery,
  useGetSavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
  type Job
} from "@/lib/redux/api/jobseekerApi";
import { Briefcase, MapPin, DollarSign, Search, Bookmark, BookmarkCheck } from "lucide-react";
import toast from "react-hot-toast";

const JobSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow border animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-10 bg-gray-200 rounded w-full"></div>
  </div>
);

export default function JobsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const userLoading = status === "loading";

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");

  const { data: jobsData, isLoading: jobsLoading } = useGetAllJobsQuery(
    { search, location },
    { skip:!user }
  );

  const { data: applications, isLoading: appsLoading } = useGetMyApplicationsQuery(undefined, {
    skip:!user || (user as { role?: string })?.role!== "jobseeker"
  });

  const { data: savedData } = useGetSavedJobsQuery(undefined, {
    skip:!user
  });
  const [saveJob, { isLoading: saving }] = useSaveJobMutation();
  const [unsaveJob] = useUnsaveJobMutation();

  const jobs: Job[] = jobsData?.jobs || [];

  const appliedJobIds = Array.isArray(applications)
   ? applications.map((a: { job?: { _id: string } | string }) =>
        typeof a.job === 'object'? a.job?._id : a.job
      )
    : [];

  const savedJobIds = savedData?.savedJobs?.map(j => j._id) || [];

  const handleToggleSave = async (jobId: string) => {
    try {
      if (savedJobIds.includes(jobId)) {
        await unsaveJob(jobId).unwrap();
        toast.success("Removed from saved");
      } else {
        await saveJob(jobId).unwrap();
        toast.success("Job saved!");
      }
    } catch {
      toast.error("Failed");
    }
  };

  const isLoading = userLoading || jobsLoading || appsLoading;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (user && (user as { role?: string })?.role!== "jobseeker") router.push("/dashboard");
  }, [user, status, router]);

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <JobSkeleton key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 pb-24 md:pb-6">
        <h1 className="text-3xl font-bold mb-2">Find Your Dream Job</h1>
        <p className="text-gray-600 mb-6">Browse {jobs.length} open positions — {savedJobIds.length} saved</p>

        <div className="bg-white p-4 rounded-xl shadow mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2 border rounded-lg px-3">
            <Search className="text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Job title, keywords..."
              className="w-full py-2 outline-none"
            />
          </div>
          <div className="flex-1 flex items-center gap-2 border rounded-lg px-3">
            <MapPin className="text-gray-400" size={18} />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="w-full py-2 outline-none"
            />
          </div>
          <Link href="/dashboard/saved" className="px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium flex items-center gap-2 justify-center">
            <Bookmark size={18} /> Saved ({savedJobIds.length})
          </Link>
        </div>

        {jobs.length === 0? (
          <div className="text-center py-20 bg-white rounded-xl shadow">
            <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No jobs found. Try different keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => {
              const alreadyApplied = appliedJobIds.includes(job._id);
              const isSaved = savedJobIds.includes(job._id);
              return (
                <div
                  key={job._id}
                  className="bg-white p-6 rounded-xl shadow border hover:shadow-lg transition flex flex-col group"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-xl font-semibold group-hover:text-blue-600 transition line-clamp-1">{job.title}</h3>
                      <button
                        onClick={() => handleToggleSave(job._id)}
                        className={`p-2 rounded-full border transition ${isSaved? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white hover:bg-gray-50 text-gray-400"}`}
                      >
                        {isSaved? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                      </button>
                    </div>
                    <p className="text-gray-700 font-medium mb-3">{job.company}</p>
                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2"><MapPin size={14} /> {job.location}</div>
                      <div className="flex items-center gap-2"><DollarSign size={14} /> {job.salary}</div>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">{job.description?? ""}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-3">
                      Posted: {job.createdAt? new Date(job.createdAt).toLocaleDateString() : "N/A"}
                    </p>

                    {alreadyApplied? (
                      <div className="w-full py-2.5 rounded-lg font-semibold bg-gray-200 text-gray-500 text-center cursor-not-allowed">
                        ✓ Applied
                      </div>
                    ) : (
                      <Link
                        href={`/dashboard/jobs/${job._id}`}
                        className="w-full py-2.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white text-center block transition"
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  );
}