"use client";
import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetProfileQuery, useUpdateProfileMutation, useDeleteProfileMutation } from "@/lib/redux/api/profileApi";
import { useUploadThing } from "@/lib/utils/uploadthing";
import { Loader2, Save, FileText, User, MapPin, Phone, Briefcase, X, Sparkles, AlertCircle, Trash2, Eye } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

const PdfPreview = dynamic(() => import("@/app/components/PdfPreview"), {
  ssr: false,
  loading: () => <div className="p-10 text-center text-[11px] flex flex-col items-center gap-2"><Loader2 className="animate-spin text-blue-600"/> Loading CV...</div>
});

function ProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const isFromJob = redirectUrl?.includes("/dashboard/jobs/");

  const { data: profile, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [deleteProfile, { isLoading: isDeleting }] = useDeleteProfileMutation();

  const { startUpload: uploadImage, isUploading: isImgUp } = useUploadThing("profileImage");
  const { startUpload: uploadResume, isUploading: isResUp } = useUploadThing("resume");

  const [form, setForm] = useState({
    firstName: "", lastName: "", headline: "", bio: "", phone: "", location: "",
    profileImage: "", resumeUrl: "", resumeName: "", skills: [] as string[]
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [pdfPreviewLocal, setPdfPreviewLocal] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (profile &&!initialized.current) {
      initialized.current = true;
      setForm({
        firstName: profile.firstName || "", lastName: profile.lastName || "",
        headline: profile.headline || "", bio: profile.bio || "",
        phone: profile.phone || "", location: profile.location || "",
        profileImage: profile.profileImage || "", resumeUrl: profile.resumeUrl || "",
        resumeName: profile.resumeName || "", skills: profile.skills || [],
      });
    }
  }, [profile]);

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.type!== "application/pdf") { toast.error("PDF only"); return; }
    setResumeFile(f);
    setForm(prev => ({...prev, resumeName: f.name }));
    setPdfPreviewLocal(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!form.firstName ||!form.lastName) { toast.error("First & Last name required"); return; }
    if (!form.resumeUrl &&!resumeFile) { toast.error("Please upload CV first"); return; }
    try {
      const final = {...form };
      if (imageFile) {
        toast.loading("Uploading photo...");
        const res = await uploadImage([imageFile]);
        if (!res?.[0]?.ufsUrl) throw new Error("Photo upload failed");
        final.profileImage = res[0].ufsUrl;
        toast.dismiss();
      }
      if (resumeFile) {
        toast.loading("Uploading CV...");
        const res = await uploadResume([resumeFile]);
        if (!res?.[0]?.ufsUrl) throw new Error("CV upload failed");
        final.resumeUrl = res[0].ufsUrl;
        final.resumeName = res[0].name;
        toast.dismiss();
      }
      await updateProfile(final).unwrap();
      setImageFile(null); setResumeFile(null); setImagePreview(""); setPdfPreviewLocal("");
      toast.success(isFromJob? "CV updated! Back to job..." : "Profile saved!");
      const clean = (redirectUrl || "").replace(/&?edited=1|&?edit=1/g, "").replace(/\?$/, "");
      const finalUrl = clean.includes("edited")? clean : `${clean}${clean.includes("?")? "&" : "?"}edited=1`;
      setTimeout(() => router.push(isFromJob? finalUrl : redirectUrl || "/dashboard/jobs"), 600);
    } catch (err: unknown) {
      toast.dismiss();
      const message = err instanceof Error? err.message : "Failed to save ❌";
      toast.error(message);
    }
  };

  const handleClear = async () => {
    try {
      await deleteProfile().unwrap();
      toast.success("Profile cleared");
      setShowDelete(false);
      setForm({ firstName: "", lastName: "", headline: "", bio: "", phone: "", location: "", profileImage: "", resumeUrl: "", resumeName: "", skills: [] });
      setImagePreview(""); setPdfPreviewLocal(""); setImageFile(null); setResumeFile(null);
      initialized.current = false;
    } catch {
      toast.error("Failed to clear profile");
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || form.skills.includes(s)) return;
    setForm({...form, skills: [...form.skills, s] }); setSkillInput("");
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white sm:bg-[#f8fafc]"><Loader2 className="animate-spin text-blue-600" size={28} /></div>;

  const isCV_missing =!form.resumeUrl &&!resumeFile;
  const isBusy = isUpdating || isImgUp || isResUp;
  const isDisabled = isBusy || isCV_missing;
  const pdfToShow = pdfPreviewLocal || form.resumeUrl;
  const hasProfileData =!!(profile?.resumeUrl);

  return (
    <div className="min-h-screen bg-white sm:bg-[#f8fafc]">
      <main className="w-full max-w-6xl mx-auto pb-24 sm:pb-6 px-0 sm:px-4 md:px-8">
        {/* Header compact */}
        <div className="mx-3 sm:mx-0 mt-3 sm:mt-6 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 text-white rounded-2xl sm:rounded-[20px] p-4 sm:p-6 shadow-sm">
          <h1 className="text-[15px] sm:text-[20px] font-bold flex items-center gap-2"><Sparkles size={16} /> My Profile</h1>
          <p className="text-blue-100 text-[11px] sm:text-[13px] mt-1 leading-snug">{hasProfileData? "Update CV via Replace CV below." : "CV required — Save disabled until upload."}</p>
        </div>

        <div className="mt-3 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-3 sm:gap-5 px-3 sm:px-0">
          {/* LEFT - compact cards */}
          <div className="space-y-3 lg:sticky lg:top-20 h-fit">
            <div className="bg-white sm:border sm:rounded-2xl border-y sm:border-gray-100 p-4 shadow-sm sm:shadow-sm text-center">
              <h3 className="font-semibold text-left text-gray-900 mb-3 text-[12px]">Profile Photo</h3>
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gray-50 overflow-hidden relative ring-2 ring-blue-50">
                {imagePreview? <Image src={imagePreview} alt="preview" fill className="object-cover" unoptimized />
                : form.profileImage? <Image src={form.profileImage} alt="profile" fill className="object-cover" unoptimized />
                : <div className="flex items-center justify-center h-full text-gray-400"><User size={28} /></div>}
              </div>
              <label className="mt-3 block w-full bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium px-3 py-2 rounded-xl cursor-pointer">
                Choose Photo
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]; if (!f) return;
                  setImageFile(f); setImagePreview(URL.createObjectURL(f));
                }} />
              </label>
            </div>

            <div className={`bg-white sm:rounded-2xl sm:border p-4 shadow-sm border-y ${isCV_missing? 'border-yellow-200 sm:border-yellow-200' : 'border-gray-100 sm:border-gray-100'}`}>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-1.5 text-[12px]">
                <FileText size={14} /> Resume / CV
                {pdfToShow && <span className="text-green-600 text-[10px] ml-auto">● Ready</span>}
              </h3>

              {pdfToShow? (
                <div className="mb-3 rounded-xl overflow-hidden border border-gray-200 bg-white">
                  <div className="p-4 text-center bg-gray-50">
                    <div className="w-10 h-10 mx-auto bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                      <FileText className="text-blue-600" size={20} />
                    </div>
                    <p className="text-[11px] font-semibold truncate">{form.resumeName || "CV.pdf"}</p>
                    <p className="text-[10px] text-green-600 mt-1">✓ Ready</p>
                    <div className="flex gap-1.5 mt-3">
                      <button onClick={()=>{
                        const isMobile = typeof window!== 'undefined' && window.innerWidth < 768;
                        if (isMobile) window.open(pdfToShow, "_blank");
                        else setShowPreview(true);
                      }} className="flex-1 bg-blue-600 text-white text-[11px] font-medium py-2 rounded-xl flex items-center justify-center gap-1">
                        <Eye size={12}/> Preview
                      </button>
                      <a href={pdfToShow} target="_blank" rel="noopener noreferrer" className="flex-1 bg-gray-900 text-white text-[11px] py-2 rounded-xl text-center">Open</a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-xl p-5 text-center mb-3 bg-gray-50/50">
                  <FileText className="mx-auto text-gray-300 mb-1" size={20} />
                  <p className="text-[11px] text-gray-400">No CV yet</p>
                </div>
              )}

              <label className={`block w-full text-center text-white text-[12px] font-medium py-2 rounded-xl cursor-pointer ${isCV_missing? 'bg-yellow-600' : 'bg-gray-900'}`}>
                {pdfToShow? "Replace CV (PDF)" : "Choose CV (PDF)"}
                <input type="file" accept="application/pdf" className="hidden" onChange={handleResumeChange} />
              </label>
              {resumeFile && <p className="text-[10px] text-green-600 mt-1.5 truncate">{resumeFile.name} - will upload on Save</p>}
            </div>
          </div>

          {/* RIGHT - Form compact */}
          <div className="bg-white sm:border sm:rounded-2xl border-y sm:border-gray-100 p-4 sm:p-6 shadow-sm sm:shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold uppercase text-gray-500">First Name *</label><input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value })} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] bg-gray-50/50 outline-none focus:ring-1 focus:ring-blue-500" /></div>
              <div><label className="text-[10px] font-bold uppercase text-gray-500">Last Name *</label><input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value })} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] bg-gray-50/50 outline-none focus:ring-1 focus:ring-blue-500" /></div>
              <div className="sm:col-span-2"><label className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1"><Briefcase size={10} /> Headline</label><input value={form.headline} onChange={e => setForm({...form, headline: e.target.value })} placeholder="MERN Developer" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] bg-gray-50/50 outline-none focus:ring-1 focus:ring-blue-500" /></div>
              <div><label className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1"><Phone size={10} /> Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value })} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] bg-gray-50/50 outline-none focus:ring-1 focus:ring-blue-500" /></div>
              <div><label className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1"><MapPin size={10} /> Location</label><input value={form.location} onChange={e => setForm({...form, location: e.target.value })} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] bg-gray-50/50 outline-none focus:ring-1 focus:ring-blue-500" /></div>
              <div className="sm:col-span-2">
  <label className="text-[10px] font-bold uppercase text-gray-500">Bio</label>
  <textarea
    rows={4}
    value={form.bio}
    onChange={e => {
      setForm({...form, bio: e.target.value });
      // auto grow
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
    }}
    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] bg-gray-50/50 outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-[80px] max-h-[200px] overflow-y-auto"
    placeholder="Tell about yourself..."
  />
</div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase text-gray-500">Skills</label>
                <div className="flex gap-2 mt-1"><input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add skill + Enter" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-[13px] bg-gray-50/50 outline-none focus:ring-1 focus:ring-blue-500" /><button type="button" onClick={addSkill} className="bg-blue-600 text-white px-4 rounded-xl text-[12px] font-semibold">Add</button></div>
                <div className="flex flex-wrap gap-1.5 mt-2">{form.skills.map((s, i) => <span key={i} className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1">{s} <X size={12} className="cursor-pointer" onClick={() => setForm({...form, skills: form.skills.filter((_, idx) => idx!== i) })} /></span>)}</div>
              </div>
            </div>
            <button disabled={isDisabled} onClick={handleSave} className={`mt-4 w-full font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-[13px] transition ${isCV_missing? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50"}`}>
              {isBusy? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {isCV_missing? "Upload CV to Save" : isBusy? "Uploading..." : isFromJob? "Save & Apply" : "Save Profile"}
            </button>
            {isCV_missing && <p className="text-[10px] text-amber-600 mt-2 text-center flex items-center justify-center gap-1"><AlertCircle size={10} /> CV required to save</p>}
          </div>
        </div>

        {hasProfileData && (
          <div className="mx-3 sm:mx-0 mt-3 bg-white sm:border border-y sm:border-red-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div>
                <h3 className="text-[12px] font-bold text-red-600 flex items-center gap-1.5"><Trash2 size={14}/> Clear Profile Data</h3>
                <p className="text-[11px] text-gray-500 mt-1">Delete photo, CV, and fields. Login stays.</p>
              </div>
              <button onClick={() => setShowDelete(true)} className="w-full sm:w-auto shrink-0 bg-red-500 hover:bg-red-600 text-white text-[12px] font-medium px-5 py-2 rounded-xl flex items-center justify-center gap-1.5">
                <Trash2 size={12}/> Clear My Profile
              </button>
            </div>
          </div>
        )}
      </main>

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
            <h4 className="font-bold text-[14px]">Clear profile data?</h4>
            <p className="text-[11px] text-gray-600 mt-1.5">This will delete photo, CV, and fields from DB and UploadThing.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowDelete(false)} className="flex-1 border rounded-xl py-2 text-[12px]">Cancel</button>
              <button disabled={isDeleting} onClick={handleClear} className="flex-1 bg-orange-600 text-white rounded-xl py-2 text-[12px] flex items-center justify-center gap-1">
                {isDeleting? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>} Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && pdfToShow && (
        <div className="fixed inset-0 z-[100] bg-white hidden sm:flex flex-col">
          <div className="flex items-center justify-between p-3 border-b bg-white">
            <h3 className="text-[13px] font-semibold truncate">{form.resumeName}</h3>
            <button onClick={()=>setShowPreview(false)} className="p-1.5 bg-gray-100 rounded-full"><X size={16}/></button>
          </div>
          <div className="flex-1 overflow-auto bg-[#f1f5f9]">
            <PdfPreview file={pdfToShow} />
          </div>
        </div>
      )}
    </div>
  );
}
export default function ProfilePage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={28} /></div>}><ProfileForm /></Suspense>;
}