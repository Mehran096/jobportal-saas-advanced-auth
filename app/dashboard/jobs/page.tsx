"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/app/components/DashboardHeader";
import SearchSuggestion from "@/app/components/SearchSuggestion";
import Pagination from "@/app/components/Pagination";
import {
  useGetAllJobsQuery,
  useGetMyApplicationsQuery,
  useGetSavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
  type Job
} from "@/lib/redux/api/jobseekerApi";
import { Briefcase, MapPin, Bookmark, BookmarkCheck, Search, TrendingUp, Users, X } from "lucide-react";
import toast from "react-hot-toast";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";
 

const JobSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow border animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-10 bg-gray-200 rounded w-full"></div>
  </div>
);

function PeopleAlsoSearch({ currentSearch, allJobs, onSelect }: { currentSearch: string; allJobs: Job[]; onSelect: (q: string) => void }) {
  const related = useMemo(() => {
    if (allJobs.length === 0) return [];
    const titles = [...new Set(allJobs.map((j) => j.title))] as string[];
    const locations = [...new Set(allJobs.map((j) => j.location))] as string[];
    const companies = [...new Set(allJobs.map((j) => j.company))] as string[];
    const base = currentSearch? titles.filter((t) => t.toLowerCase()!== currentSearch.toLowerCase()) : titles;
    const combos = [
   ...base.slice(0, 5),
   ...locations.map((l) => `${currentSearch || "Developer"} jobs in ${l}`).slice(0, 3),
   ...companies.map((c) => `${c} jobs`).slice(0, 2),
   ...titles.map((t) => `${t} remote`).slice(0, 2),
    ];
    return [...new Set(combos)].filter(Boolean).slice(0, 10);
  }, [currentSearch, allJobs]);

  if (related.length === 0) return null;

  return (
    <div className="mt-10 bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Users size={18} className="text-blue-600" /> People also search for
      </h3>
      <div className="flex flex-wrap gap-2.5">
        {related.map((term) => (
          <button key={term} onClick={() => onSelect(term)} className="group flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-sm text-gray-700 hover:text-blue-700 transition">
            <Search size={12} className="text-gray-400 group-hover:text-blue-500" />
            {term}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-400">
        <TrendingUp size={12} /> Trending searches from your job feed
      </div>
    </div>
  );
}

export default function JobsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const userLoading = status === "loading";

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [datePosted, setDatePosted] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const { data: jobsData, isLoading: jobsLoading } = useGetAllJobsQuery({ search, location, jobType, minSalary, datePosted }, { skip:!user });
  const { data: allJobsData } = useGetAllJobsQuery({}, { skip:!user });
  const { data: applications, isLoading: appsLoading } = useGetMyApplicationsQuery(undefined, { skip:!user || (user as { role?: string })?.role!== "jobseeker" });
  const { data: savedData } = useGetSavedJobsQuery(undefined, { skip:!user });
  const [saveJob] = useSaveJobMutation();
  const [unsaveJob] = useUnsaveJobMutation();

  const jobs: Job[] = useMemo(() => jobsData?.jobs?? [], [jobsData]);
  const allJobs: Job[] = useMemo(() => allJobsData?.jobs?? [], [allJobsData]);

  const isSearching = useMemo(() => search.trim()!== "" || location.trim()!== "" || jobType!== "" || minSalary!== "" || datePosted!== "", [search, location, jobType, minSalary, datePosted]);

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    setCurrentPage(1);
  }, []);

  const handleLocationChange = useCallback((val: string) => {
    setLocation(val);
    setCurrentPage(1);
  }, []);

  const handlePeopleSearch = useCallback((q: string) => {
    setSearch(q);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const clearFilters = useCallback(() => {
    setJobType("");
    setMinSalary("");
    setDatePosted("");
    setCurrentPage(1);
  }, []);

  const paginatedJobs = useMemo(() => {
    if (!isSearching) return jobs;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return jobs.slice(start, start + ITEMS_PER_PAGE);
  }, [jobs, currentPage, isSearching]);

  const displayJobs = useMemo(() => {
    if (isSearching) return paginatedJobs;
    return jobs;
  }, [isSearching, jobs, paginatedJobs]);

  const titleOptions = useMemo(() => [...new Set([...allJobs.map((j) => j.title),...allJobs.map((j) => j.company)])] as string[], [allJobs]);
  const locationOptions = useMemo(() => [...new Set(allJobs.map((j) => j.location))] as string[], [allJobs]);

  const appliedJobIds = useMemo(() => Array.isArray(applications)? applications.map((a: { job?: { _id: string } | string }) => typeof a.job === "object"? a.job?._id : a.job) : [], [applications]);
  const savedJobIds = useMemo(() => savedData?.savedJobs?.map((j) => j._id)?? [], [savedData]);

  const handleToggleSave = useCallback(async (jobId: string) => {
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
  }, [savedJobIds, saveJob, unsaveJob]);

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
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <JobSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto mb-16 p-4 sm:p-6 pb-24 md:pb-6">
        <h1 className="text-3xl font-bold mb-2">Find Your Dream Job</h1>
        <p className="text-gray-600 mb-6">Browse {jobs.length} open positions — {savedJobIds.length} saved</p>

        <div className="bg-white p-4 rounded-xl shadow mb-4 flex flex-col md:flex-row gap-4">
          <SearchSuggestion value={search} onChange={handleSearchChange} allOptions={titleOptions} placeholder="Job title, keywords, company" type="title" recentKey="recent_job_search" />
          <SearchSuggestion value={location} onChange={handleLocationChange} allOptions={locationOptions} placeholder="Location" type="location" recentKey="recent_loc_search" />
          <Link href="/dashboard/saved" className="px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium flex items-center gap-2 justify-center h-[42px] lg:hidden">
            <Bookmark size={18} /> Saved ({savedJobIds.length})
          </Link>
        </div>

        {/* Indeed-style filters */}
        <div className="bg-white p-3 rounded-xl shadow mb-8 flex flex-wrap gap-3 items-center">
          <select value={datePosted} onChange={(e)=>{setDatePosted(e.target.value); setCurrentPage(1)}} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white">
            <option value="">Date posted</option>
            <option value="24h">Last 24 hours</option>
            <option value="3d">Last 3 days</option>
            <option value="7d">Last 7 days</option>
            <option value="14d">Last 14 days</option>
          </select>

          <select value={jobType} onChange={(e)=>{setJobType(e.target.value); setCurrentPage(1)}} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white">
            <option value="">Job type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Remote">Remote</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>

          <select value={minSalary} onChange={(e)=>{setMinSalary(e.target.value); setCurrentPage(1)}} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white">
            <option value="">Pay (Rs.)</option>
            <option value="50000">Rs. 50k+</option>
            <option value="100000">Rs. 100k+</option>
            <option value="200000">Rs. 200k+</option>
            <option value="500000">Rs. 500k+</option>
            <option value="1000000">Rs. 1M+</option>
          </select>

          {(jobType || minSalary || datePosted) && (
            <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-700">
              <X size={14} /> Clear filters
            </button>
          )}
        </div>

        {displayJobs.length === 0? (
          <div className="text-center py-20 bg-white rounded-xl shadow">
            <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No jobs found for {search || jobType || "your filters"}. Try different keywords.</p>
            {(jobType || minSalary || datePosted) && <button onClick={clearFilters} className="mt-3 text-blue-600 text-sm font-medium">Clear all filters</button>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayJobs.map((job) => {
                const alreadyApplied = appliedJobIds.includes(job._id);
                const isSaved = savedJobIds.includes(job._id);
                return (
                  <div key={job._id} className="bg-white p-6 rounded-xl shadow border hover:shadow-lg transition flex flex-col group">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-xl font-semibold group-hover:text-blue-600 transition line-clamp-1">{job.title}</h3>
                        <button onClick={() => handleToggleSave(job._id)} className={`p-2 rounded-full border transition ${isSaved? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white hover:bg-gray-50 text-gray-400"}`}>
                          {isSaved? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>
                      </div>
                      <p className="text-gray-700 font-medium mb-1">{job.company}</p>
                      {job.type && <span className="inline-block mb-3 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">{job.type}</span>}
                      <div className="space-y-2 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-2"><MapPin size={14} /> {job.location}</div>
                        <div className="flex items-center gap-2"><span className="font-bold text-gray-700">Rs.</span> {Number(job.salary).toLocaleString("en-PK")} / month</div>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">{job.description?? ""}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-3">Posted: {job.createdAt? new Date(job.createdAt).toLocaleDateString() : "N/A"}</p>
                      {alreadyApplied? <div className="w-full py-2.5 rounded-lg font-semibold bg-gray-200 text-gray-500 text-center">✓ Applied</div> : <Link href={`/dashboard/jobs/${job._id}`} className="w-full py-2.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white text-center block transition">View Details</Link>}
                    </div>
                  </div>
                );
              })}
            </div>

            {isSearching && <Pagination currentPage={currentPage} totalItems={jobs.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />}

            <PeopleAlsoSearch currentSearch={search} allJobs={allJobs} onSelect={handlePeopleSearch} />
          </>
        )}
      </main>
      <DashboardMobileNav />
    </div>
  );
}