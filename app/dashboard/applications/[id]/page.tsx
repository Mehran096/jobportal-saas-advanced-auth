"use client";
export const dynamic = 'force-dynamic';

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import DashboardHeader from "@/app/components/DashboardHeader";
import { useGetApplicationByIdQuery } from "@/lib/redux/api/employerApi";
import { ArrowLeft, Mail, Phone, MapPin, FileText, ExternalLink, Download, Briefcase, Building2, Calendar, CheckCircle2, XCircle, Star, Clock, Globe, Building } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";

type StatusKey = "accepted" | "rejected" | "shortlisted" | "pending" | "reviewed";
type StatusStyle = { bg: string; border: string; text: string; Icon: LucideIcon; label: string; desc: string };

const STATUS_MAP: Record<StatusKey, StatusStyle> = {
  accepted: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", Icon: CheckCircle2, label: "Accepted", desc: "Congrats! Employer accepted" },
  shortlisted: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", Icon: Star, label: "Shortlisted", desc: "You are shortlisted!" },
  rejected: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", Icon: XCircle, label: "Rejected", desc: "Not selected" },
  pending: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", Icon: Clock, label: "Pending", desc: "Under review" },
  reviewed: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", Icon: Clock, label: "Reviewed", desc: "Viewed by employer" },
};

interface Snapshot { firstName?: string; lastName?: string; headline?: string; bio?: string; email?: string; phone?: string; location?: string; profileImage?: string; skills?: string[]; resumeUrl?: string; resumeName?: string; }
interface Applicant { firstName?: string; lastName?: string; title?: string; headline?: string; bio?: string; email?: string; phone?: string; location?: string; profilePicture?: string; avatar?: string; image?: string; skills?: string[]; }
interface CompanyProfile { companyName: string; companyLogo?: string; companyWebsite?: string; companySize?: string; companyDescription?: string; location?: string; }

export default function MyApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data, isLoading } = useGetApplicationByIdQuery(id as string);

  if (isLoading) return <div className="min-h-screen bg-white sm:bg-gray-50"><DashboardHeader /><div className="p-6 text-center text-[13px]">Loading...</div></div>;
  if (!data?.application) return <div className="min-h-screen bg-white sm:bg-gray-50"><DashboardHeader /><div className="p-6 text-center text-[13px]">Application not found</div></div>;

  const app = data.application as { _id: string; status: StatusKey; createdAt: string; snapshot: Snapshot; applicant: Applicant; job?: { title?: string; company?: string; location?: string } };
  const s = app.snapshot || {};
  const live = app.applicant || {};
  const job = data.job as { title?: string; company?: string; location?: string } | undefined;
  const companyProfile = data.companyProfile as CompanyProfile | undefined;

  const profile = {
    firstName: live.firstName || s.firstName || "",
    lastName: live.lastName || s.lastName || "",
    headline: live.title || live.headline || s.headline || "Job Seeker",
    bio: live.bio || s.bio || "",
    email: live.email || s.email || "",
    phone: live.phone || s.phone || "",
    location: live.location || s.location || "",
    profileImage: live.profilePicture || live.avatar || live.image || s.profileImage || "",
    skills: live.skills && live.skills.length > 0? live.skills : s.skills || [],
    resumeUrl: s.resumeUrl || "",
    resumeName: s.resumeName || "resume.pdf",
  };

  const st = STATUS_MAP[app.status] || STATUS_MAP.pending;
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || "User";

  return (
    <div className="min-h-screen bg-white sm:bg-gray-50">
      <DashboardHeader />
      <main className="max-w-6xl mx-auto px-0 sm:px-6 pb-24 sm:pb-6">
        {/* Back */}
        <div className="px-3 sm:px-0 pt-3 sm:pt-6 mb-3">
          <button onClick={() => router.push("/dashboard/applications")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white text-[12px] text-gray-700">
            <ArrowLeft size={14} /> Back to Applications
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 px-3 sm:px-0">
          {/* LEFT */}
          <div className="lg:col-span-5 space-y-3 h-fit">
            {/* Status compact */}
            <div className={`rounded-xl border p-2.5 sm:p-3 flex gap-2.5 ${st.bg} ${st.border}`}>
              <div className={`w-7 h-7 rounded-full bg-white border flex items-center justify-center shrink-0 ${st.text}`}><st.Icon size={14} /></div>
              <div className="min-w-0">
                <p className={`text-[13px] font-semibold ${st.text}`}>{st.label}</p>
                <p className="text-[11px] text-gray-600 leading-tight">{st.desc}</p>
              </div>
            </div>

            {/* Job + Company */}
            <div className="bg-white sm:border sm:rounded-2xl sm:shadow-sm border-y sm:border-gray-100 p-3.5 sm:p-5">
              <h4 className="font-bold text-[10px] sm:text-[11px] tracking-wide text-gray-500 flex items-center gap-1 mb-2"><Briefcase size={12} className="text-blue-600" /> APPLIED JOB</h4>
              <p className="font-bold text-[14px] sm:text-[15px] leading-tight truncate">{job?.title || app.job?.title || "Job Title"}</p>
              <div className="flex flex-wrap gap-1.5 mt-2 text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border"><Building size={10} />{companyProfile?.companyName || job?.company || app.job?.company || "Company"}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border"><MapPin size={10} />{companyProfile?.location || job?.location || "Lahore"}</span>
              </div>

              <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100 flex gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-white relative overflow-hidden ring-1 ring-gray-200 shrink-0">
                  {companyProfile?.companyLogo? <Image src={companyProfile.companyLogo} alt="logo" fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full text-gray-400"><Building2 size={16} /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[12px] truncate">{companyProfile?.companyName || "Company"}</p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 truncate"><Globe size={10} />{companyProfile?.companyWebsite || "No website"} • {companyProfile?.companySize || "Size N/A"}</p>
                  <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-snug">{companyProfile?.companyDescription || "No description."}</p>
                </div>
              </div>
            </div>

            {/* Profile compact */}
            <div className="bg-white sm:border sm:rounded-2xl sm:shadow-sm border-y sm:border-gray-100 p-3.5 sm:p-5">
              <div className="flex gap-2.5">
                <Image src={profile.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`} width={40} height={40} unoptimized alt={fullName} className="w-10 h-10 rounded-full object-cover border shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-[14px] font-bold leading-tight truncate">{fullName}</h1>
                  <p className="text-blue-600 text-[11px] font-medium leading-tight line-clamp-2">{profile.headline}</p>
                  <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1"><Building2 size={10} /> Applied: <b className="truncate">{job?.title || app.job?.title}</b></p>
                </div>
              </div>

              {profile.bio && <p className="text-[12px] text-gray-600 mt-3 leading-normal whitespace-pre-wrap wrap-break-words">{profile.bio}</p>}

              <div className="mt-3 space-y-1.5 text-[11px] text-gray-700">
                <p className="flex gap-1.5 items-center truncate"><Mail size={12} className="shrink-0 text-gray-400" /> <span className="truncate">{profile.email}</span></p>
                <p className="flex gap-1.5 items-center"><Phone size={12} className="shrink-0 text-gray-400" /> {profile.phone || "No phone"}</p>
                <p className="flex gap-1.5 items-center truncate"><MapPin size={12} className="shrink-0 text-gray-400" /> <span className="truncate">{profile.location || "No location"}</span></p>
                <p className="flex gap-1.5 items-center text-[10px] text-gray-500"><Calendar size={11} /> {new Date(app.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="mt-3">
                <h4 className="font-semibold flex gap-1.5 mb-1.5 text-[11px]"><Briefcase size={12} /> Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {profile.skills.length > 0? profile.skills.map((sk) => (
                    <span key={sk} className="bg-gray-50 px-2 py-0.5 rounded-full text-[10px] border">{sk}</span>
                  )) : <span className="text-[11px] text-gray-400">No skills</span>}
                </div>
              </div>

              <div className="mt-3 bg-blue-50/70 p-2.5 rounded-xl flex items-center justify-between gap-2 border border-blue-100">
                <span className="text-[11px] flex items-center gap-1.5 truncate min-w-0"><FileText size={12} className="shrink-0" /> <span className="truncate">{profile.resumeName}</span></span>
                <div className="flex gap-1.5 shrink-0">
                  <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="bg-white border px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1"><ExternalLink size={11} /> View</a>
                  <a href={profile.resumeUrl} download className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1"><Download size={11} /> DL</a>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - CV */}
          <div className="lg:col-span-7 bg-white sm:border sm:rounded-2xl border-y sm:border-gray-100 overflow-hidden lg:h-[82vh] flex flex-col">
            <div className={`p-2.5 sm:p-3 border-b flex justify-between items-center ${st.bg}`}>
              <h2 className="font-semibold text-[12px] sm:text-[13px] truncate max-w-[65%]">CV Preview - {job?.title || app.job?.title}</h2>
              <span className={`text-[10px] capitalize px-2.5 py-1 rounded-full border font-bold ${st.bg} ${st.border} ${st.text}`}>{app.status}</span>
            </div>

            {profile.resumeUrl? (
              <>
                {/* Desktop iframe */}
                <div className="hidden sm:block flex-1">
                  <iframe src={`${profile.resumeUrl}#toolbar=0&navpanes=0`} className="w-full h-full min-h-150" title="CV" />
                </div>
                {/* Mobile small preview card */}
                <div className="sm:hidden p-3">
                  <div className="rounded-xl border overflow-hidden bg-white">
                    <div className="p-5 text-center bg-gray-50">
                      <div className="w-12 h-12 mx-auto bg-blue-100 rounded-xl flex items-center justify-center mb-2.5">
                        <FileText className="text-blue-600" size={22} />
                      </div>
                      <p className="text-[12px] font-semibold truncate">{profile.resumeName}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{fullName} - CV</p>
                      <div className="flex gap-2 mt-3">
                        <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-600 text-white text-[11px] font-medium py-2 rounded-xl text-center flex items-center justify-center gap-1">
                          <ExternalLink size={12} /> Preview
                        </a>
                        <a href={profile.resumeUrl} download className="flex-1 bg-gray-900 text-white text-[11px] py-2 rounded-xl text-center flex items-center justify-center gap-1">
                          <Download size={12} /> Download
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[12px] text-gray-400 p-10">No CV uploaded</div>
            )}
          </div>
        </div>
      </main>
      <DashboardMobileNav />
    </div>
  );
}