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
import { Briefcase, MapPin, Bookmark, BookmarkCheck, Search, Users, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";
import CustomDropdown from "@/app/components/ui/CustomDropdown";

const JobSkeleton = () => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-pulse">
    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
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
    const combos = [...base.slice(0, 5),...locations.map((l) => `${currentSearch || "Developer"} jobs in ${l}`).slice(0, 3),...companies.map((c) => `${c} jobs`).slice(0, 2)];
    return [...new Set(combos)].filter(Boolean).slice(0, 10);
  }, [currentSearch, allJobs]);
  if (related.length === 0) return null;
  return (
    <div className="mt-6 bg-white border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
      <h3 className="font-semibold text-[14px] sm:text-base text-gray-900 flex items-center gap-2 mb-3">
        <Users size={16} className="text-blue-600" /> People also search for
      </h3>
      <div className="flex flex-wrap gap-2">
        {related.map((term) => (
          <button key={term} onClick={() => onSelect(term)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-blue-50 border border-gray-200 text-[12px] sm:text-sm text-gray-700 transition">
            <Search size={11} /> {term}
          </button>
        ))}
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

  // ✅ isFetching for filter/search loading
  const { data: jobsData, isLoading: jobsLoading, isFetching } = useGetAllJobsQuery({ search, location, jobType, minSalary, datePosted }, { skip:!user });
  const { data: allJobsData } = useGetAllJobsQuery({}, { skip:!user });
  const { data: applications, isLoading: appsLoading } = useGetMyApplicationsQuery(undefined, { skip:!user || (user as { role?: string })?.role!== "jobseeker" });
  const { data: savedData } = useGetSavedJobsQuery(undefined, { skip:!user });
  const [saveJob] = useSaveJobMutation();
  const [unsaveJob] = useUnsaveJobMutation();

  const jobs: Job[] = useMemo(() => jobsData?.jobs?? [], [jobsData]);
  const allJobs: Job[] = useMemo(() => allJobsData?.jobs?? [], [allJobsData]);
  const isSearching = useMemo(() => search.trim()!== "" || location.trim()!== "" || jobType!== "" || minSalary!== "" || datePosted!== "", [search, location, jobType, minSalary, datePosted]);

  const handleSearchChange = useCallback((val: string) => { setSearch(val); setCurrentPage(1); }, []);
  const handleLocationChange = useCallback((val: string) => { setLocation(val); setCurrentPage(1); }, []);
  const handlePeopleSearch = useCallback((q: string) => { setSearch(q); setCurrentPage(1); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  //const clearFilters = useCallback(() => { setJobType(""); setMinSalary(""); setDatePosted(""); setCurrentPage(1); }, []);
  const clearAll = useCallback(() => { setSearch(""); setLocation(""); setJobType(""); setMinSalary(""); setDatePosted(""); setCurrentPage(1); }, []);

  const paginatedJobs = useMemo(() => {
    if (!isSearching) return jobs;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return jobs.slice(start, start + ITEMS_PER_PAGE);
  }, [jobs, currentPage, isSearching]);
  const displayJobs = useMemo(() => (isSearching? paginatedJobs : jobs), [isSearching, jobs, paginatedJobs]);
  const titleOptions = useMemo(() => [...new Set([...allJobs.map((j) => j.title),...allJobs.map((j) => j.company)])] as string[], [allJobs]);
  const locationOptions = useMemo(() => [...new Set(allJobs.map((j) => j.location))] as string[], [allJobs]);
  const appliedJobIds = useMemo(() => Array.isArray(applications)? applications.map((a: { job?: { _id: string } | string }) => typeof a.job === "object"? a.job?._id : a.job) : [], [applications]);
  const savedJobIds = useMemo(() => savedData?.savedJobs?.map((j) => j._id)?? [], [savedData]);

  const handleToggleSave = useCallback(async (jobId: string) => {
    try {
      if (savedJobIds.includes(jobId)) { await unsaveJob(jobId).unwrap(); toast.success("Removed from saved"); }
      else { await saveJob(jobId).unwrap(); toast.success("Job saved!"); }
    } catch { toast.error("Failed"); }
  }, [savedJobIds, saveJob, unsaveJob]);

  const isInitialLoading = userLoading || jobsLoading || appsLoading;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (user && (user as { role?: string })?.role!== "jobseeker") router.push("/dashboard");
  }, [user, status, router]);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto p-3 sm:p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <JobSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pb-24 md:pb-6 pt-3 sm:pt-6">
        {/* HEADER WITH FETCHING LOADER */}
        <div className="mb-3 sm:mb-5 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-[19px] sm:text-3xl font-bold leading-tight tracking-tight">Find Your Dream Job</h1>
            <p className="text-[12px] sm:text-[15px] text-gray-500 mt-0.5">Browse {jobs.length} open — {savedJobIds.length} saved</p>
          </div>
          {isFetching && (
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full shrink-0">
              <Loader2 size={12} className="animate-spin" /> Searching...
            </div>
          )}
        </div>

        {/* SEARCH WITH CROSS */}
        <div className="bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-gray-100 mb-3 flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <SearchSuggestion value={search} onChange={handleSearchChange} allOptions={titleOptions} placeholder="Job title, keywords, company" type="title" recentKey="recent_job_search" />
            {search && (
              <button onClick={() => handleSearchChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex-1 relative">
            <SearchSuggestion value={location} onChange={handleLocationChange} allOptions={locationOptions} placeholder="Location" type="location" recentKey="recent_loc_search" />
            {location && (
              <button onClick={() => handleLocationChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

      {/* FILTERS - COMPACT MOBILE SO CLEAR IS VISIBLE */}
<div className="bg-white border border-gray-100 rounded-xl shadow-sm mb-4 relative z-20 overflow-hidden">
  <div className="flex items-center">
    <div className="flex-1 overflow-x-auto scrollbar-hide scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2.5 flex-nowrap">
        <CustomDropdown
          variant="pill"
          value={datePosted}
          onChange={(v) => { setDatePosted(v); setCurrentPage(1); }}
          placeholder="Date posted"
          options={[
            { label: "Date posted", value: "" },
            { label: "Last 24h", value: "24h" },
            { label: "Last 3d", value: "3d" },
            { label: "Last 7d", value: "7d" },
            { label: "Last 14d", value: "14d" },
          ]}
        />
        <CustomDropdown
          variant="pill"
          value={jobType}
          onChange={(v) => { setJobType(v); setCurrentPage(1); }}
          placeholder="Job type"
          options={[
            { label: "Job type", value: "" },
            { label: "Full-time", value: "Full-time" },
            { label: "Part-time", value: "Part-time" },
            { label: "Remote", value: "Remote" },
            { label: "Contract", value: "Contract" },
            { label: "Internship", value: "Internship" },
          ]}
        />
        <CustomDropdown
          variant="pill"
          value={minSalary}
          onChange={(v) => { setMinSalary(v); setCurrentPage(1); }}
          placeholder="Pay (Rs.)"
          options={[
            { label: "Pay (Rs.)", value: "" },
            { label: "50k+", value: "50000" },
            { label: "100k+", value: "100000" },
            { label: "200k+", value: "200000" },
            { label: "500k+", value: "500000" },
          ]}
        />
        {/* spacer for scroll end */}
        <span className="block w-2 h-1 shrink-0 sm:hidden" />
      </div>
    </div>

    {isSearching && (
      <div className="shrink-0 bg-white pl-1.5 pr-2 sm:pl-2 sm:pr-2.5 py-1.5 sm:py-2 border-l border-gray-100 shadow-[-8px_0_12px_white] flex items-center">
        <button
          onClick={clearAll}
          className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-[13px] text-red-600 font-bold hover:bg-red-50 rounded-full whitespace-nowrap transition"
        >
          <X size={12} /> Clear
        </button>
      </div>
    )}
  </div>
</div>

        {displayJobs.length === 0 &&!isFetching? (
          <div className="text-center py-14 bg-white rounded-xl shadow-sm border">
            <Briefcase className="mx-auto text-gray-400 mb-3" size={36} />
            <p className="text-[13px] text-gray-500 px-4">No jobs for {search || jobType || "your filters"}</p>
            {isSearching && <button onClick={clearAll} className="mt-2 text-blue-600 text-[13px] font-medium">Clear all filters</button>}
          </div>
        ) : (
          <>
            {/* GRID WITH LOADING SKELETONS ON FETCH */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 transition ${isFetching? "opacity-70" : "opacity-100"}`}>
              {isFetching? (
                [1,2,3,4,5,6].map((i) => <JobSkeleton key={i} />)
              ) : (
                displayJobs.map((job) => {
                  const alreadyApplied = appliedJobIds.includes(job._id);
                  const isSaved = savedJobIds.includes(job._id);
                  return (
                    <Link key={job._id} href={`/dashboard/jobs/${job._id}`} className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition flex flex-col group cursor-pointer">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="text-[14.5px] sm:text-[16px] font-semibold group-hover:text-blue-600 line-clamp-1 leading-snug">{job.title}</h3>
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleSave(job._id); }} className={`shrink-0 p-1.5 rounded-full border transition ${isSaved? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white text-gray-400 hover:bg-gray-50"}`}>
                            {isSaved? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                          </button>
                        </div>
                        <p className="text-[12px] sm:text-[13px] text-gray-700 font-medium mb-1 truncate">{job.company}</p>
                        {job.type && <span className="inline-block mb-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">{job.type}</span>}
                        <div className="space-y-1 text-[11px] sm:text-[12px] text-gray-500 mb-2.5">
                          <div className="flex items-center gap-1.5"><MapPin size={11} className="shrink-0" /> <span className="truncate">{job.location}</span></div>
                          <div className="flex items-center gap-1.5"><span className="font-bold text-gray-700">Rs.</span> {Number(job.salary).toLocaleString("en-PK")} / mo</div>
                        </div>
                        <p className="text-[12px] sm:text-[13px] text-gray-600 line-clamp-2 leading-[1.4]">{job.description?? ""}</p>
                      </div>
                      <div className="mt-3">
                        <p className="text-[10px] text-gray-400 mb-2">Posted: {job.createdAt? new Date(job.createdAt).toLocaleDateString() : "N/A"}</p>
                        {alreadyApplied? <div className="w-full py-2 rounded-lg bg-gray-100 text-gray-500 text-center text-[12px] font-semibold">✓ Applied</div> : <div className="w-full py-2 rounded-lg bg-blue-600 group-hover:bg-blue-700 text-white text-center text-[12px] font-semibold transition">View Details</div>}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            {isSearching &&!isFetching && <Pagination currentPage={currentPage} totalItems={jobs.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />}
            <PeopleAlsoSearch currentSearch={search} allJobs={allJobs} onSelect={handlePeopleSearch} />
          </>
        )}
      </main>
      <DashboardMobileNav />
    </div>
  );
}