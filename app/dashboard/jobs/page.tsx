"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/app/components/DashboardHeader";
import { 
  useGetAllJobsQuery, 
  useApplyForJobMutation,
  useGetMyApplicationsQuery,
  type Job
} from "@/lib/redux/api/jobseekerApi";
import { Briefcase, MapPin, DollarSign, Search, Loader2 } from "lucide-react";

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
  const user = session?.user as any;
  const userLoading = status === "loading";

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");

  const { data: jobsData, isLoading: jobsLoading } = useGetAllJobsQuery(
    { search, location }, 
    { skip: !user }
  );

  const { data: applications, isLoading: appsLoading } = useGetMyApplicationsQuery(undefined, {
    skip: !user || user?.role !== "jobseeker"
  });

  const [applyForJob, { isLoading: applying }] = useApplyForJobMutation();

  const jobs: Job[] = jobsData?.jobs || [];
  
  // FIXED: now applications is array directly, handles both cases
  const appliedJobIds = Array.isArray(applications)
    ? applications.map((a: any) => a.job?._id || a.job)
    : (applications as any)?.applications?.map((a: any) => a.job?._id || a.job) || [];

  const isLoading = userLoading || jobsLoading || appsLoading;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (user && user.role !== "jobseeker") router.push("/dashboard");
  }, [user, status, router]);

  const handleApply = async (jobId: string) => {
    try {
      await applyForJob(jobId).unwrap();
      alert("Applied successfully! Your CV is sent to employer.");
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'data' in err) {
        alert((err.data as { message?: string })?.message || "Failed to apply");
      } else {
        alert("Failed to apply");
      }
    }
  };

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
        <p className="text-gray-600 mb-6">Browse {jobs.length} open positions</p>

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
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow">
            <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No jobs found. Try different keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => {
              const alreadyApplied = appliedJobIds.includes(job._id);
              return (
                <div 
                  key={job._id} 
                  className="bg-white p-6 rounded-xl shadow border hover:shadow-lg transition flex flex-col group"
                >
                  <Link href={`/dashboard/jobs/${job._id}`} className="flex-1">
                    <div className="cursor-pointer">
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition">{job.title}</h3>
                      <p className="text-gray-700 font-medium mb-3">{job.company}</p>
                      <div className="space-y-2 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-2"><MapPin size={14} /> {job.location}</div>
                        <div className="flex items-center gap-2"><DollarSign size={14} /> {job.salary}</div>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">{job.description ?? ""}</p>
                    </div>
                  </Link>
                  
                  <div>
                    <p className="text-xs text-gray-400 mb-3">
                      Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleApply(job._id);
                      }}
                      disabled={alreadyApplied || applying}
                      className={`w-full py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                        alreadyApplied
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {applying && <Loader2 className="animate-spin" size={16} />}
                      {alreadyApplied ? "✓ Applied" : applying ? "Applying..." : "Apply Now"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">
        <Link href="/dashboard/jobs" className="text-blue-600 text-xs flex flex-col items-center"><Briefcase size={20}/>Jobs</Link>
        <Link href="/dashboard/applications" className="text-gray-500 text-xs flex-col items-center"><Briefcase size={20}/>Applications</Link>
      </nav>
    </div>
  );
}