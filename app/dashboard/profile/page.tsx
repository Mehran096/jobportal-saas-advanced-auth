"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetProfileQuery, useUpdateProfileMutation } from "@/lib/redux/api/profileApi";
import { UploadButton } from "@/lib/utils/uploadthing";
import DashboardHeader from "@/app/components/DashboardHeader";
import { Loader2, Save, FileText, User, MapPin, Phone, Briefcase, X, Sparkles } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

function ProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const { data: profile, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [form, setForm] = useState({
    firstName: "", lastName: "", headline: "", bio: "", phone: "", location: "",
    profileImage: "", resumeUrl: "", resumeName: "", skills: [] as string[]
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        location: profile.location || "",
        profileImage: profile.profileImage || "",
        resumeUrl: profile.resumeUrl || "",
        resumeName: profile.resumeName || "",
        skills: profile.skills || [],
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!form.firstName ||!form.lastName) {
      toast.error("First & Last name required");
      return;
    }
    try {
      await updateProfile(form).unwrap();
      toast.success("Profile saved!");
      setTimeout(() => {
        router.push(redirectUrl || "/dashboard/jobs");
      }, 600);
    } catch {
      toast.error("Failed to save ❌");
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || form.skills.includes(s)) return;
    setForm({...form, skills: [...form.skills, s] });
    setSkillInput("");
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <DashboardHeader />
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-600 to-indigo-600 text-white rounded-[20px] p-6 md:p-8 mb-6 md:mb-8 shadow-xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Sparkles size={24} /> My Profile</h1>
          <p className="text-blue-100 text-sm mt-2 max-w-xl">This is how employers see you. Keep your photo & CV updated to get 3x more interview calls.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-[20px] border border-gray-100 p-6 shadow-sm text-center">
              <h3 className="font-semibold text-left text-gray-900 mb-4">Profile Photo</h3>
              <div className="w-32 h-32 mx-auto rounded-full bg-gray-50 overflow-hidden relative ring-4 ring-blue-50 shadow-inner">
                {form.profileImage? <Image src={form.profileImage} alt="profile" fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full text-gray-400"><User size={44} /></div>}
              </div>
              <div className="mt-5 ut-wrapper">
                <UploadButton endpoint="profileImage" onClientUploadComplete={(res) => { if (res?.[0]?.ufsUrl) setForm({...form, profileImage: res[0].ufsUrl }); }} appearance={{ container: "w-full!flex!flex-col items-center", button: "w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl ut-button", allowedContent: "hidden" }} />
                <style>{`.ut-wrapper input[type="file"]{display:none!important}.ut-wrapper label{width:100%} [data-ut-element="button"]{width:100%!important; cursor:pointer}`}</style>
              </div>
            </div>

            <div className="bg-white rounded-[20px] border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-600" /> Resume / CV</h3>
              {form.resumeUrl? (
                <div className="bg-green-50 border border-green-200/60 p-4 rounded-xl mb-4">
                  <p className="truncate font-semibold text-green-800 text-sm">{form.resumeName || "Resume.pdf"}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <a href={form.resumeUrl} target="_blank" className="text-xs bg-green-600 text-white px-3 py-1 rounded-full">View PDF</a>
                    <a href={form.resumeUrl} download className="text-xs text-green-700 underline">Download</a>
                  </div>
                </div>
              ) : <div className="border border-dashed rounded-xl p-4 text-center mb-4"><p className="text-sm text-gray-500">No CV uploaded yet — required to apply</p></div>}
              <div className="mt-3 ut-wrapper">
                <UploadButton endpoint="resume" onClientUploadComplete={(res) => { if (res?.[0]) setForm({...form, resumeUrl: res[0].ufsUrl, resumeName: res[0].name }); }} appearance={{ container: "w-full!flex!flex-col items-center", button: "w-full bg-gray-900 hover:bg-black text-white text-sm font-medium py-2.5 rounded-xl", allowedContent: "hidden" }} />
              </div>
              <p className="text-[11px] text-gray-400 mt-2 text-center">PDF only, max 4MB</p>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-gray-100 p-5 md:p-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              <div><label className="text-xs font-semibold text-gray-700 uppercase">First Name</label><input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value })} className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition" /></div>
              <div><label className="text-xs font-semibold text-gray-700 uppercase">Last Name</label><input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value })} className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition" /></div>
              <div className="sm:col-span-2"><label className="text-xs font-semibold text-gray-700 uppercase flex items-center gap-1.5"><Briefcase size={14} /> Headline</label><input placeholder="e.g. MERN Stack Developer | Open to remote" value={form.headline} onChange={e => setForm({...form, headline: e.target.value })} className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition" /></div>
              <div><label className="text-xs font-semibold text-gray-700 uppercase flex items-center gap-1.5"><Phone size={14} /> Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value })} className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition" /></div>
              <div><label className="text-xs font-semibold text-gray-700 uppercase flex items-center gap-1.5"><MapPin size={14} /> Location</label><input value={form.location} onChange={e => setForm({...form, location: e.target.value })} className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition" /></div>
              <div className="sm:col-span-2"><label className="text-xs font-semibold text-gray-700 uppercase">Bio</label><textarea rows={4} value={form.bio} onChange={e => setForm({...form, bio: e.target.value })} className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none transition" /></div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Skills</label>
                <div className="flex gap-2 mt-2"><input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add skill and press Enter" className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition" /><button onClick={addSkill} className="bg-blue-600 text-white px-6 rounded-xl text-sm font-semibold">Add</button></div>
                <div className="flex flex-wrap gap-2 mt-4">{form.skills.map((s, i) => <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200/70 px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">{s} <X size={14} className="cursor-pointer hover:text-red-600 bg-white rounded-full p-0.5" onClick={() => setForm({...form, skills: form.skills.filter((_, idx) => idx!== i) })} /></span>)}</div>
              </div>
            </div>
            <button disabled={isUpdating} onClick={handleSave} className="mt-8 w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]">
              {isUpdating? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{isUpdating? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
      <ProfileForm />
    </Suspense>
  );
}