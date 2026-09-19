"use client";
import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetProfileQuery, useUpdateProfileMutation, useDeleteProfileMutation } from "@/lib/redux/api/profileApi";
import { useUploadThing } from "@/lib/utils/uploadthing";
import DashboardHeader from "@/app/components/DashboardHeader";
import { Loader2, Save, FileText, User, MapPin, Phone, Briefcase, X, Sparkles, AlertCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  const isCV_missing =!form.resumeUrl &&!resumeFile;
  const isBusy = isUpdating || isImgUp || isResUp;
  const isDisabled = isBusy || isCV_missing;
  const pdfToShow = pdfPreviewLocal || form.resumeUrl;
  // show delete only if profile has data
  const hasProfileData =!!(profile?.firstName || profile?.profileImage || profile?.resumeUrl);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <DashboardHeader />
      <main className="w-full max-w-6xl mx-auto p-3 sm:p-4 md:p-8 overflow-x-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 text-white rounded-[20px] p-5 md:p-8 mb-6 shadow-xl">
          <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2"><Sparkles size={24} /> My Profile</h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-2">CV is required — button disabled until upload.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 sm:gap-6 items-start">
          <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-[20px] border border-gray-100 p-5 sm:p-6 shadow-sm text-center">
              <h3 className="font-semibold text-left text-gray-900 mb-4 text-sm">Profile Photo</h3>
              <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-full bg-gray-50 overflow-hidden relative ring-4 ring-blue-50 shadow-inner">
                {imagePreview? <Image src={imagePreview} alt="preview" fill className="object-cover" unoptimized />
                : form.profileImage? <Image src={form.profileImage} alt="profile" fill className="object-cover" unoptimized />
                : <div className="flex items-center justify-center h-full text-gray-400"><User size={44} /></div>}
              </div>
              <label className="mt-5 block w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl cursor-pointer">
                Choose Photo
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]; if (!f) return;
                  setImageFile(f); setImagePreview(URL.createObjectURL(f));
                }} />
              </label>
              {imageFile && <p className="text-xs text-green-600 mt-2 truncate">{imageFile.name} - will upload on Save</p>}
            </div>

            <div className={`bg-white rounded-[20px] border p-5 sm:p-6 shadow-sm ${isCV_missing? 'border-yellow-200 ring-2 ring-yellow-100' : 'border-gray-100'}`}>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm"><FileText size={18} /> Resume / CV {pdfToShow && <span className="text-green-600 text-[10px] ml-auto">● Preview below</span>}</h3>
              {pdfToShow? (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <iframe src={pdfToShow} className="w-full h-[600px]" title="CV Preview" />
                  <div className="p-2 flex justify-between bg-white border-t text-[11px]">
                    <span className="truncate">{form.resumeName}</span>
                    <a href={pdfToShow} target="_blank" className="text-blue-600 underline shrink-0 ml-2">Open full</a>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center mb-4 bg-gray-50/50">
                  <FileText className="mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400">No CV yet — upload PDF to preview here</p>
                </div>
              )}
              <label className={`block w-full text-center text-white text-sm font-medium py-2.5 rounded-xl cursor-pointer ${isCV_missing? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-900 hover:bg-black'}`}>
                {pdfToShow? "Replace CV (PDF)" : "Choose CV (PDF)"}
                <input type="file" accept="application/pdf" className="hidden" onChange={handleResumeChange} />
              </label>
              {resumeFile && <p className="text-xs text-green-600 mt-2 truncate">{resumeFile.name} - will upload on Save</p>}
            </div>

           
          </div>

          <div className="bg-white rounded-[20px] border border-gray-100 p-4 sm:p-5 md:p-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-[11px] font-semibold uppercase">First Name *</label><input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3 text-sm bg-gray-50/50" /></div>
              <div><label className="text-[11px] font-semibold uppercase">Last Name *</label><input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3 text-sm bg-gray-50/50" /></div>
              <div className="sm:col-span-2"><label className="text-[11px] font-semibold uppercase flex items-center gap-1.5"><Briefcase size={14} /> Headline</label><input value={form.headline} onChange={e => setForm({...form, headline: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3 text-sm bg-gray-50/50" /></div>
              <div><label className="text-[11px] font-semibold uppercase flex items-center gap-1.5"><Phone size={14} /> Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3 text-sm bg-gray-50/50" /></div>
              <div><label className="text-[11px] font-semibold uppercase flex items-center gap-1.5"><MapPin size={14} /> Location</label><input value={form.location} onChange={e => setForm({...form, location: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3 text-sm bg-gray-50/50" /></div>
              <div className="sm:col-span-2"><label className="text-[11px] font-semibold uppercase">Bio</label><textarea rows={4} value={form.bio} onChange={e => setForm({...form, bio: e.target.value })} className="mt-2 w-full border rounded-xl px-4 py-3 text-sm bg-gray-50/50 resize-none" /></div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold uppercase">Skills</label>
                <div className="flex gap-2 mt-2"><input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add skill + Enter" className="flex-1 border rounded-xl px-4 py-3 text-sm bg-gray-50/50" /><button type="button" onClick={addSkill} className="bg-blue-600 text-white px-6 rounded-xl text-sm font-semibold">Add</button></div>
                <div className="flex flex-wrap gap-2 mt-4">{form.skills.map((s, i) => <span key={i} className="bg-blue-50 text-blue-700 border px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5">{s} <X size={14} className="cursor-pointer" onClick={() => setForm({...form, skills: form.skills.filter((_, idx) => idx!== i) })} /></span>)}</div>
              </div>
            </div>

            <button disabled={isDisabled} onClick={handleSave} title={isCV_missing? "Please upload CV first" : ""} className={`mt-6 w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition ${isCV_missing? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50"}`}>
              {isBusy? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {isCV_missing? "Upload CV to Save" : isBusy? "Uploading..." : isFromJob? "Save & Apply to Job" : "Save Profile"}
            </button>
            {isCV_missing && <p className="text-[11px] text-amber-600 mt-2 text-center flex items-center justify-center gap-1"><AlertCircle size={12} /> CV is required to save profile</p>}
          </div>
        </div>
         {/* SHOW DELETE ONLY IF USER HAS PROFILE DATA */}
            {hasProfileData && (
          <div className="w-full max-w-full mt-6 bg-white rounded-[20px] border border-red-200 p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-red-600 flex items-center gap-2"><Trash2 size={16}/> Clear Profile Data</h3>
                <p className="text-xs text-gray-500 mt-1">Delete photo, CV, and all fields. Your login stays, you can create new profile again.</p>
              </div>
              <button onClick={() => setShowDelete(true)} className="w-full sm:w-auto shrink-0 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-6 py-2.5 rounded-xl flex items-center justify-center gap-2">
                <Trash2 size={14}/> Clear My Profile
              </button>
            </div>
          </div>
        )}
      </main>

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h4 className="font-bold text-gray-900">Clear profile data?</h4>
            <p className="text-xs text-gray-600 mt-2">This will delete your photo, CV, and all fields from DB and UploadThing. Your account login will stay.</p>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowDelete(false)} className="flex-1 border rounded-xl py-2.5 text-sm">Cancel</button>
              <button disabled={isDeleting} onClick={handleClear} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-2.5 text-sm flex items-center justify-center gap-2">
                {isDeleting? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>} Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default function ProfilePage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}><ProfileForm /></Suspense>;
}