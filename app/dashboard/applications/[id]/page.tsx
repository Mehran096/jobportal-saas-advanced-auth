"use client";
export const dynamic = 'force-dynamic';

import { useParams, useRouter } from "next/navigation";
import DashboardHeader from "@/app/components/DashboardHeader";
import { useGetApplicationByIdQuery } from "@/lib/redux/api/employerApi";
import { ArrowLeft, FileText, Building2, Calendar, CheckCircle2, XCircle, Star, Clock, Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StatusKey = "accepted" | "rejected" | "shortlisted" | "reviewed" | "pending";

type StatusConfig = {
  color: string;
  label: string;
  Icon: LucideIcon;
  desc: string;
};

export default function MyApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data, isLoading } = useGetApplicationByIdQuery(id as string);

  if (isLoading) return <div className="p-10 text-center">Loading...</div>;
  if (!data?.application) return <div className="p-10 text-center">Application not found</div>;

  const app = data.application;
  const job = data.job;
  const resumeUrl = app.snapshot?.resumeUrl as string | undefined;

  const statusMap: Record<StatusKey, StatusConfig> = {
    accepted: { color: "bg-green-100 text-green-700 border-green-200", label: "Accepted", Icon: CheckCircle2, desc: "Congratulations! Employer accepted your application" },
    rejected: { color: "bg-red-100 text-red-700 border-red-200", label: "Rejected", Icon: XCircle, desc: "This application was not selected" },
    shortlisted: { color: "bg-purple-100 text-purple-700 border-purple-200", label: "Shortlisted", Icon: Star, desc: "You are shortlisted! Employer will contact you soon" },
    reviewed: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Reviewed", Icon: Eye, desc: "Employer viewed your application" },
    pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Pending", Icon: Clock, desc: "Under review" },
  };

  const st = statusMap[app.status as StatusKey] || statusMap.pending;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto p-3 sm:p-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 mb-4 text-sm hover:bg-white px-3 py-2 rounded-lg border">
          <ArrowLeft size={16} /> Back to Applications
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-xl border p-6 h-fit">
            <div className={`p-4 rounded-xl border flex gap-3 ${st.color}`}>
              <st.Icon size={20} />
              <div>
                <p className="font-bold">{st.label}</p>
                <p className="text-xs opacity-80">{st.desc}</p>
              </div>
            </div>

            <h1 className="text-xl font-bold mt-5 wrap-break-word">{job?.title || app.job?.title}</h1>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1"><Building2 size={14}/> {app.job?.company}</p>
            <p className="text-xs text-gray-500 flex items-center gap-2 mt-2"><Calendar size={12}/> Applied on {new Date(app.createdAt).toDateString()}</p>

            <div className="mt-6 p-3 bg-gray-50 rounded-xl border">
              <p className="text-xs font-semibold flex items-center gap-1"><FileText size={12}/> CV used for this job</p>
              <p className="text-xs mt-1 truncate">{app.snapshot?.resumeName || "resume.pdf"}</p>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-xl border overflow-hidden lg:h-[85vh] flex flex-col">
            <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-sm">Your Submitted CV</h2>
              <span className={`text-xs px-2 py-1 rounded-full border capitalize ${st.color}`}>{app.status}</span>
            </div>

            {resumeUrl? (
              <>
                <div className="hidden sm:block flex-1">
                  <iframe src={resumeUrl} className="w-full h-full min-h-[40rem]" title="CV" />
                </div>
                <div className="sm:hidden">
                  {resumeUrl.startsWith("blob:")? (
                    <div className="h-[70vh] flex items-center justify-center p-8 text-center bg-gray-50">
                      <div>
                        <FileText className="mx-auto text-red-400 mb-2" size={32}/>
                        <p className="text-xs">Preview available after save</p>
                      </div>
                    </div>
                  ) : (
                    <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(resumeUrl)}&embedded=true`} className="w-full h-[70vh] bg-white" title="CV Mobile" />
                  )}
                  <div className="p-2 flex gap-2 bg-white border-t">
                    <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-600 text-white text-xs font-medium py-2.5 rounded-xl text-center">Open PDF</a>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-10">No CV found</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}