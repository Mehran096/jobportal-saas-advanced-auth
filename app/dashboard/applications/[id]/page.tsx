"use client";
export const dynamic = 'force-dynamic';

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import DashboardHeader from "@/app/components/DashboardHeader";
import { useGetApplicationByIdQuery } from "@/lib/redux/api/employerApi";
import { ArrowLeft, Mail, Phone, MapPin, FileText, ExternalLink, Download, Briefcase, Building2, Calendar, CheckCircle2, XCircle, Star, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StatusKey = "accepted" | "rejected" | "shortlisted" | "pending" | "reviewed";

type StatusStyle = {
  bg: string;
  border: string;
  text: string;
  Icon: LucideIcon;
  label: string;
  desc: string;
};

const STATUS_MAP: Record<StatusKey, StatusStyle> = {
  accepted: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    Icon: CheckCircle2,
    label: "Accepted",
    desc: "Congratulations! Employer accepted your application",
  },
  shortlisted: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    Icon: Star,
    label: "Shortlisted",
    desc: "You are shortlisted! Employer will contact you soon",
  },
  rejected: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    Icon: XCircle,
    label: "Rejected",
    desc: "This application was not selected",
  },
  pending: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    Icon: Clock,
    label: "Pending",
    desc: "Under review by employer",
  },
  reviewed: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    Icon: Clock,
    label: "Reviewed",
    desc: "Employer viewed your application",
  },
};

interface Snapshot {
  firstName?: string;
  lastName?: string;
  headline?: string;
  bio?: string;
  email?: string;
  phone?: string;
  location?: string;
  profileImage?: string;
  skills?: string[];
  resumeUrl?: string;
  resumeName?: string;
}

interface Applicant {
  firstName?: string;
  lastName?: string;
  title?: string;
  headline?: string;
  bio?: string;
  email?: string;
  phone?: string;
  location?: string;
  profilePicture?: string;
  avatar?: string;
  image?: string;
  skills?: string[];
}

export default function MyApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data, isLoading } = useGetApplicationByIdQuery(id as string);

  if (isLoading) return <div className="p-10 text-center">Loading...</div>;
  if (!data?.application) return <div className="p-10 text-center">Application not found</div>;

  const app = data.application as { _id: string; status: StatusKey; createdAt: string; snapshot: Snapshot; applicant: Applicant; job?: { title?: string } };
  const s = app.snapshot || {};
  const live = app.applicant || {};
  const job = data.job as { title?: string } | undefined;

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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto p-3 sm:p-6">
        <button onClick={() => router.push("/dashboard/applications")} className="flex items-center gap-2 mb-4 text-sm px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
          <ArrowLeft size={16} /> Back to Applications
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4 h-fit">
            {/* STATUS with colors */}
            <div className={`p-4 rounded-xl border flex gap-3 ${st.bg} ${st.border}`}>
              <st.Icon className={`w-5 h-5 ${st.text}`} />
              <div>
                <p className={`font-bold ${st.text}`}>{st.label}</p>
                <p className="text-xs text-gray-600">{st.desc}</p>
              </div>
            </div>

            {/* Profile - same as employer */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex gap-4">
                <Image
                  src={profile.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`}
                  width={64} height={64} unoptimized alt={fullName}
                  className="w-16 h-16 rounded-full object-cover border"
                />
                <div className="min-w-0">
                  <h1 className="text-xl font-bold wrap-break-word">{fullName}</h1>
                  <p className="text-blue-600 text-sm font-medium wrap-break-word">{profile.headline}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Building2 size={12}/> Applied for: <b>{job?.title || app.job?.title}</b></p>
                </div>
              </div>

              {profile.bio && <p className="text-sm text-gray-600 mt-4 leading-relaxed whitespace-pre-wrap wrap-break-word">{profile.bio}</p>}

              <div className="mt-5 space-y-2 text-sm text-gray-700">
                <p className="flex gap-2 items-center"><Mail size={16} className="shrink-0" /> <span className="wrap-break-word">{profile.email}</span></p>
                <p className="flex gap-2 items-center"><Phone size={16} className="shrink-0" /> {profile.phone || "No phone"}</p>
                <p className="flex gap-2 items-center"><MapPin size={16} className="shrink-0" /> <span className="wrap-break-word">{profile.location || "No location"}</span></p>
                <p className="flex gap-2 items-center text-xs text-gray-500"><Calendar size={14}/> Applied on {new Date(app.createdAt).toDateString()}</p>
              </div>

              <div className="mt-5">
                <h4 className="font-semibold flex gap-2 mb-2 text-sm"><Briefcase size={16} /> Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.length > 0? profile.skills.map((sk) => (
                    <span key={sk} className="bg-gray-100 px-3 py-1 rounded-full text-xs border">{sk}</span>
                  )) : <span className="text-xs text-gray-400">No skills</span>}
                </div>
              </div>

              <div className="mt-5 bg-blue-50 p-3 rounded-xl flex items-center justify-between gap-2 border border-blue-100">
                <span className="text-sm flex items-center gap-2 truncate min-w-0"><FileText size={16} className="shrink-0" /> <span className="truncate">{profile.resumeName}</span></span>
                <div className="flex gap-2 shrink-0">
                  <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="bg-white border px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"><ExternalLink size={12} /> View</a>
                  <a href={profile.resumeUrl} download className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"><Download size={12} /> DL</a>
                </div>
              </div>
            </div>
          </div>

                    <div className="lg:col-span-7 bg-white rounded-xl border overflow-hidden lg:h-[85vh] flex flex-col">
            <div className={`p-3 border-b flex justify-between items-center ${st.bg}`}>
              <h2 className="font-semibold text-sm truncate max-w-[70%]">CV Preview - {job?.title || app.job?.title}</h2>
              <span className={`text-xs capitalize px-3 py-1 rounded-full border font-bold ${st.bg} ${st.border} ${st.text}`}>{app.status}</span>
            </div>

            {profile.resumeUrl? (
              <>
                {/* Desktop: direct iframe - stable on desktop */}
                <div className="hidden sm:block flex-1">
                  <iframe src={profile.resumeUrl} className="w-full h-full min-h-[650px]" title="CV" />
                </div>

                {/* Mobile MVP: file card, no iframe = no crash */}
                <div className="sm:hidden p-4">
                  <div className="rounded-xl border overflow-hidden bg-white">
                    <div className="p-6 text-center bg-gray-50">
                      <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
                        <FileText className="text-blue-600" size={32} />
                      </div>
                      <p className="text-sm font-semibold truncate">{profile.resumeName}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{fullName} - CV</p>
                      <div className="flex gap-2 mt-4">
                        <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-600 text-white text-xs font-medium py-2.5 rounded-xl text-center flex items-center justify-center gap-1">
                          <ExternalLink size={14}/> Preview
                        </a>
                        <a href={profile.resumeUrl} download className="flex-1 bg-gray-900 text-white text-xs py-2.5 rounded-xl text-center flex items-center justify-center gap-1">
                          <Download size={14}/> Download
                        </a>
                      </div>
                    </div>
                    <div className="p-2 bg-white border-t text-[10px] text-center text-gray-400 truncate">{profile.resumeName}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-10">No CV uploaded</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}