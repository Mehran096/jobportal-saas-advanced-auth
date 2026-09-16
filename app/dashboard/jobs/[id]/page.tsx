"use client";
export const dynamic = 'force-dynamic';

import { useRouter, useParams } from "next/navigation";
import { useGetJobByIdQuery } from "@/lib/redux/api/employerApi";
import { useApplyForJobMutation, useGetMyApplicationsQuery } from "@/lib/redux/api/jobseekerApi";
import { ArrowLeft, Building, MapPin, DollarSign, Calendar, Users, Loader2 } from "lucide-react";

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const jobId = id as string;

  const { data, isLoading, isError } = useGetJobByIdQuery(jobId, { 
    skip: !jobId,
    refetchOnMountOrArgChange: true
  });

  const { data: applications, isLoading: appsLoading } = useGetMyApplicationsQuery();
  const [applyForJob, { isLoading: isApplying }] = useApplyForJobMutation();

  const job = data?.job;
  const applicationCount = data?.applicationCount || 0;
  
  // FIXED: applications is now a direct array (not { applications: [] })
  const appliedJobIds = Array.isArray(applications) 
    ? applications.map((a: any) => a.job?._id || a.job) 
    : [];
    
  const alreadyApplied = appliedJobIds.includes(jobId);

  const handleApply = async () => {
    try {
      await applyForJob(jobId).unwrap();
      alert("Applied successfully! Employer can now see your CV + Bio.");
    } catch (err: any) {
      alert(err?.data?.message || "You have already applied to this job");
    }
  };

  if (isLoading || appsLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
  }

  if (isError || !job) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Job not found</h2>
        <button onClick={() => router.push("/dashboard/jobs")} className="text-blue-600 hover:underline">Go Back</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Job Details</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{job.title}</h2>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-gray-600 mb-4">
              <div className="flex items-center gap-2"><Building size={16} className="text-gray-400" /> {job.company}</div>
              <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" /> {job.location}</div>
              <div className="flex items-center gap-2 text-green-700 font-semibold"><DollarSign size={16} className="text-green-600" /> {job.salary}</div>
              <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> Posted {new Date(job.createdAt).toLocaleDateString()}</div>
              <div className="flex items-center gap-2"><Users size={16} className="text-gray-400" /> {applicationCount} Applicants</div>
            </div>

            {job.postedBy && (
              <p className="text-sm text-gray-500 border-t pt-3">
                Posted by: <span className="font-semibold">{job.postedBy.firstName} {job.postedBy.lastName}</span>
              </p>
            )}
          </div>

          <div className="border-t pt-5 mt-5">
            <h3 className="font-semibold text-lg mb-3 text-gray-900">Job Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line wrap-break-words overflow-hidden">{job.description}</p>
          </div>

          <div className="border-t pt-5 mt-5">
            <button 
              onClick={handleApply}
              disabled={alreadyApplied || isApplying}
              className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                alreadyApplied
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isApplying && <Loader2 size={18} className="animate-spin" />}
              {alreadyApplied ? "✓ Applied" : isApplying ? "Applying..." : "Apply Now"}
            </button>
            {alreadyApplied && (
              <p className="text-center text-sm text-green-600 mt-2">Your CV and profile were sent to employer</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}