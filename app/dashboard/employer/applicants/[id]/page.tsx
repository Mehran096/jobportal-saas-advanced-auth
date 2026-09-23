"use client";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import DashboardHeader from "@/app/components/DashboardHeader";
import { useGetApplicationByIdQuery, useUpdateApplicationStatusMutation } from "@/lib/redux/api/employerApi";
import { ArrowLeft, Mail, Phone, MapPin, FileText, ExternalLink, Download, Briefcase, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";

type FinalStatus = "shortlisted" | "accepted" | "rejected";

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
  const job = data.job;

  if (!s) return <div className="p-10 text-center">No candidate snapshot found</div>;

  const handleUpdate = async (status: FinalStatus) => {
    if (!confirm(`Mark as ${status}? This will send email and cannot be changed.`)) return;
    setLoadingAction(status);
    try {
      await updateStatus({ id: app._id, status }).unwrap();
      router.refresh();
    } catch (e: unknown) {
      const err = e as { data?: { message?: string } };
      const message = err?.data?.message || (e instanceof Error? e.message : "Failed to update");
      alert(message);
    } finally {
      setLoadingAction(null);
    }
  };

  const isFinal = ["accepted", "rejected", "shortlisted"].includes(app.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="max-w-7xl mb-16 mx-auto p-3 sm:p-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 mb-4 text-sm hover:bg-white px-3 py-2 rounded-lg border">
          <ArrowLeft size={16} /> Back to Applicants
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Profile */}
          <div className="lg:col-span-5 bg-white rounded-xl border p-6 h-fit">
            <div className="flex gap-4">
              <Image src={s.profileImage || `https://ui-avatars.com/api/?name=${s.firstName}+${s.lastName}`} width={64} height={64} unoptimized alt="avatar" className="w-16 h-16 rounded-full object-cover" />
              <div className="min-w-0">
                <h1 className="text-xl font-bold wrap-break-word">{s.firstName} {s.lastName}</h1>
                <p className="text-blue-600 text-sm font-medium wrap-break-word leading-snug">{s.headline || "No headline"}</p>
                <p className="text-xs text-gray-500 mt-1 wrap-break-word">Applied for: <b>{job?.title || app.job?.title}</b></p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-4 leading-relaxed whitespace-pre-wrap wrap-break-word">{s.bio || "No bio"}</p>

            <div className="mt-5 space-y-2 text-sm text-gray-700">
              <p className="flex gap-2 items-center"><Mail size={16} className="shrink-0" /> <span className="wrap-break-word">{s.email}</span></p>
              <p className="flex gap-2 items-center"><Phone size={16} className="shrink-0" /> {s.phone || "No phone"}</p>
              <p className="flex gap-2 items-center"><MapPin size={16} className="shrink-0" /> <span className="wrap-break-word">{s.location || "No location"}</span></p>
            </div>

            <div className="mt-5">
              <h4 className="font-semibold flex gap-2 mb-2 text-sm"><Briefcase size={16} /> Skills</h4>
              <div className="flex flex-wrap gap-2">
                {s.skills?.length? s.skills.map((sk: string) => (
                  <span key={sk} className="bg-gray-100 px-3 py-1 rounded-full text-xs">{sk}</span>
                )) : <span className="text-xs text-gray-400">No skills</span>}
              </div>
            </div>

            <div className="mt-5 bg-blue-50 p-3 rounded-xl flex items-center justify-between gap-2">
              <span className="text-sm flex items-center gap-2 truncate min-w-0"><FileText size={16} className="shrink-0" /> <span className="truncate">{s.resumeName || "resume.pdf"}</span></span>
              <div className="flex gap-2 shrink-0">
                <a href={s.resumeUrl} target="_blank" rel="noopener noreferrer" className="bg-white border px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"><ExternalLink size={12} /> View</a>
                <a href={s.resumeUrl} download className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"><Download size={12} /> DL</a>
              </div>
            </div>

            {isFinal? (
              <div className="mt-6 p-4 bg-gray-50 border border-dashed rounded-xl text-center">
                <CheckCircle2 className="mx-auto text-green-600 mb-1" />
                <p className="font-semibold capitalize text-sm">Already {app.status}</p>
                <p className="text-xs text-gray-500 mt-1">Status locked</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 mt-6">
                <button onClick={() => handleUpdate("shortlisted")} disabled={!!loadingAction} className="bg-purple-600 text-white py-2.5 rounded-xl text-xs flex justify-center items-center gap-1 disabled:opacity-50">
                  {loadingAction === "shortlisted" && <Loader2 size={12} className="animate-spin" />} Shortlist
                </button>
                <button onClick={() => handleUpdate("accepted")} disabled={!!loadingAction} className="bg-green-600 text-white py-2.5 rounded-xl text-xs flex justify-center items-center gap-1 disabled:opacity-50">
                  {loadingAction === "accepted" && <Loader2 size={12} className="animate-spin" />} Accept
                </button>
                <button onClick={() => handleUpdate("rejected")} disabled={!!loadingAction} className="bg-red-600 text-white py-2.5 rounded-xl text-xs flex justify-center items-center gap-1 disabled:opacity-50">
                  {loadingAction === "rejected" && <Loader2 size={12} className="animate-spin" />} Reject
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: CV Preview - DESKTOP + MOBILE */}
                    {/* RIGHT: CV Preview - DESKTOP + MOBILE */}
          <div className="lg:col-span-7 bg-white rounded-xl border overflow-hidden lg:h-[85vh] flex flex-col">
            <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-sm truncate max-w-[70%]">CV Preview - {job?.title || app.job?.title}</h2>
              <span className="text-xs capitalize px-2 py-1 rounded-full bg-yellow-100 font-medium">{app.status}</span>
            </div>

            {s.resumeUrl? (
              <>
                {/* DESKTOP - direct, fast */}
                <div className="hidden sm:block flex-1">
                  <iframe src={`${s.resumeUrl}#toolbar=0&navpanes=0`} className="w-full h-full min-h-[650px]" title="CV Preview" />
                </div>
                

                {/* MOBILE - proxy to stop download popup */}
                <div className="sm:hidden p-4">
                  <div className="rounded-xl border overflow-hidden bg-white">
                    <div className="p-6 text-center bg-gray-50">
                      <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
                        <FileText className="text-blue-600" size={32} />
                      </div>
                      <p className="text-sm font-semibold truncate">{s.resumeName || "resume.pdf"}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{s.firstName} {s.lastName} - CV</p>
                      <div className="flex gap-2 mt-4">
                        <a
                          href={s.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-blue-600 text-white text-xs font-medium py-2.5 rounded-xl text-center flex items-center justify-center gap-1"
                        >
                          <ExternalLink size={14}/> Preview
                        </a>
                        <a
                          href={s.resumeUrl}
                          download
                          className="flex-1 bg-gray-900 text-white text-xs py-2.5 rounded-xl text-center flex items-center justify-center gap-1"
                        >
                          <Download size={14}/> Download
                        </a>
                      </div>
                    </div>
                    <div className="p-2 bg-white border-t text-[10px] text-center text-gray-400 truncate">{s.resumeName || "resume.pdf"}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-10">No CV uploaded</div>
            )}
          </div>
        </div>
      </main>
      <DashboardMobileNav />
    </div>
  );
}