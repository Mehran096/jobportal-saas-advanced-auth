"use client";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import DashboardHeader from "@/app/components/DashboardHeader";
import { useGetApplicationByIdQuery, useUpdateApplicationStatusMutation } from "@/lib/redux/api/employerApi";
import { ArrowLeft, Mail, Phone, MapPin, FileText, ExternalLink, Download, Briefcase, Loader2, CheckCircle2, Building2, Globe, Building } from "lucide-react";
import { useState } from "react";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";

type FinalStatus = "shortlisted" | "accepted" | "rejected";
interface CompanyProfile { companyName: string; companyLogo?: string; companyWebsite?: string; companySize?: string; companyDescription?: string; location?: string; phone?: string; }
interface JobInfo { _id?: string; title?: string; company?: string; location?: string; }

export default function ApplicantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<FinalStatus | null>(null);
  const { data, isLoading } = useGetApplicationByIdQuery(id as string);
  const [updateStatus] = useUpdateApplicationStatusMutation();

  if (isLoading) return <div className="p-10 text-center">Loading candidate...</div>;
  if (!data?.application) return <div className="p-10 text-center">Applicant not found</div>;

  const app = data.application;
  const s = app.snapshot;
  const job = data.job as JobInfo | undefined;
  const jobFromApp = app.job as JobInfo | string | undefined;
  const jobTitle = job?.title || (typeof jobFromApp === 'object'? jobFromApp?.title : undefined) || "N/A";
  const jobCompany = job?.company || (typeof jobFromApp === 'object'? jobFromApp?.company : undefined);
  const companyProfile = data.companyProfile as CompanyProfile | undefined;

  if (!s) return <div className="p-10 text-center">No candidate snapshot found</div>;

  const handleUpdate = async (status: FinalStatus) => {
    if (!confirm(`Mark as ${status}? This will send email and cannot be changed.`)) return;
    setLoadingAction(status);
    try { await updateStatus({ id: app._id, status }).unwrap(); router.refresh(); }
    catch (e: unknown) { const err = e as { data?: { message?: string } }; alert(err?.data?.message || "Failed"); }
    finally { setLoadingAction(null); }
  };
  const isFinal = ["accepted", "rejected", "shortlisted"].includes(app.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto p-3 sm:p-6 pb-28 lg:pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 mb-5 text-sm px-4 py-2 rounded-full border bg-white hover:bg-gray-50">
          <ArrowLeft size={16} /> Back to Applicants
        </button>

        {/* TOP FULL WIDTH - COMPANY PROFILE LIKE YOUR SCREENSHOT */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 mb-6">
          <h4 className="font-bold text-[11px] tracking-widest text-gray-500 mb-3 flex items-center gap-2"><Building2 size={12} className="text-blue-600"/> YOUR COMPANY PROFILE</h4>
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-50 relative overflow-hidden ring-1 ring-gray-200 flex-shrink-0">
              {companyProfile?.companyLogo? (
                <Image src={companyProfile.companyLogo} alt="logo" fill className="object-cover" unoptimized priority />
              ) : <div className="flex items-center justify-center h-full text-gray-400"><Building size={20}/></div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[14px] text-gray-900">{companyProfile?.companyName || jobCompany || "ITBS - IT Business Solutions"}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500 mt-1">
                <span className="flex items-center gap-1"><MapPin size={11}/>{companyProfile?.location || "Lahore"}</span>
                <span className="flex items-center gap-1"><Building size={11}/>{companyProfile?.companySize || "500+"}</span>
                <span className="flex items-center gap-1 text-blue-600"><Globe size={11}/>{companyProfile?.companyWebsite || "www.itbs.pk"}</span>
              </div>
              <p className="text-[12px] text-gray-600 mt-3 leading-relaxed">{companyProfile?.companyDescription || "ITBS is a leading IT services and software development company based in Lahore, Pakistan. We specialize in web development, mobile applications, e-commerce solutions, and digital transformation for businesses across Asia and beyond."}</p>
              <div className="mt-2 text-[11px] text-gray-400">Job: <span className="font-semibold text-gray-700">{jobTitle}</span></div>
            </div>
          </div>
        </div>

        {/* BOTTOM GRID - Candidate + CV */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl border shadow-sm p-6 h-fit">
            <div className="flex gap-4">
              <Image src={s.profileImage || `https://ui-avatars.com/api/?name=${s.firstName}+${s.lastName}`} width={64} height={64} unoptimized alt="avatar" className="w-16 h-16 rounded-full object-cover border" />
              <div className="min-w-0">
                <h1 className="text-xl font-bold">{s.firstName} {s.lastName}</h1>
                <p className="text-blue-600 text-sm font-medium leading-snug">{s.headline || "No headline"}</p>
                <p className="text-xs text-gray-500 mt-1">Applied for: <b>{jobTitle}</b></p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 leading-relaxed whitespace-pre-wrap">{s.bio || "No bio"}</p>
            <div className="mt-5 space-y-2 text-sm text-gray-700 border-t pt-4">
              <p className="flex gap-2 items-center"><Mail size={16} className="shrink-0"/><span className="truncate">{s.email}</span></p>
              <p className="flex gap-2 items-center"><Phone size={16} className="shrink-0"/>{s.phone || "No phone"}</p>
              <p className="flex gap-2 items-center"><MapPin size={16} className="shrink-0"/><span className="truncate">{s.location || "No location"}</span></p>
            </div>
            <div className="mt-5">
              <h4 className="font-semibold flex gap-2 mb-2 text-sm"><Briefcase size={16}/> Skills</h4>
              <div className="flex flex-wrap gap-2">
                {s.skills?.length? s.skills.map((sk: string) => <span key={sk} className="bg-gray-100 px-3 py-1 rounded-full text-xs border">{sk}</span>) : <span className="text-xs text-gray-400">No skills</span>}
              </div>
            </div>
            <div className="mt-5 bg-blue-50 p-3 rounded-xl flex items-center justify-between gap-2 border border-blue-100">
              <span className="text-sm flex items-center gap-2 truncate"><FileText size={16} className="shrink-0"/><span className="truncate">{s.resumeName || "resume.pdf"}</span></span>
              <div className="flex gap-2 shrink-0">
                <a href={s.resumeUrl} target="_blank" className="bg-white border px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"><ExternalLink size={12}/> View</a>
                <a href={s.resumeUrl} download className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"><Download size={12}/> DL</a>
              </div>
            </div>
            {isFinal? (
              <div className="mt-6 p-4 bg-gray-50 border border-dashed rounded-xl text-center">
                <CheckCircle2 className="mx-auto text-green-600 mb-1"/><p className="font-semibold capitalize text-sm">Already {app.status}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 mt-6">
                <button onClick={() => handleUpdate("shortlisted")} disabled={!!loadingAction} className="bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-xs flex justify-center items-center gap-1 disabled:opacity-50">{loadingAction==="shortlisted" && <Loader2 size={12} className="animate-spin"/>} Shortlist</button>
                <button onClick={() => handleUpdate("accepted")} disabled={!!loadingAction} className="bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-xs flex justify-center items-center gap-1 disabled:opacity-50">{loadingAction==="accepted" && <Loader2 size={12} className="animate-spin"/>} Accept</button>
                <button onClick={() => handleUpdate("rejected")} disabled={!!loadingAction} className="bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs flex justify-center items-center gap-1 disabled:opacity-50">{loadingAction==="rejected" && <Loader2 size={12} className="animate-spin"/>} Reject</button>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border shadow-sm overflow-hidden lg:h-[85vh] flex flex-col">
            <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-sm truncate">CV Preview - {jobTitle}</h2>
              <span className={`text-xs capitalize px-3 py-1 rounded-full font-bold border ${app.status==="rejected"? "bg-red-50 text-red-700 border-red-200" : app.status==="accepted"? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>{app.status}</span>
            </div>
            {s.resumeUrl? (
              <>
                <div className="hidden sm:block flex-1"><iframe src={`${s.resumeUrl}#toolbar=0&navpanes=0`} className="w-full h-full min-h-[650px]" title="CV"/></div>
                <div className="sm:hidden p-4">
                  <div className="rounded-xl border overflow-hidden bg-white">
                    <div className="p-6 text-center bg-gray-50">
                      <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-3"><FileText className="text-blue-600" size={32}/></div>
                      <p className="text-sm font-semibold truncate">{s.resumeName}</p>
                      <div className="flex gap-2 mt-4">
                        <a href={s.resumeUrl} target="_blank" className="flex-1 bg-blue-600 text-white text-xs font-medium py-2.5 rounded-xl text-center flex items-center justify-center gap-1"><ExternalLink size={14}/> Preview</a>
                        <a href={s.resumeUrl} download className="flex-1 bg-gray-900 text-white text-xs py-2.5 rounded-xl text-center flex items-center justify-center gap-1"><Download size={14}/> Download</a>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-10">No CV uploaded</div>}
          </div>
        </div>
      </main>
      <DashboardMobileNav />
    </div>
  );
}