"use client";
import { useEffect, useState, useRef } from "react";
import { useGetProfileQuery, useUpdateProfileMutation, useDeleteProfileMutation } from "@/lib/redux/api/profileApi";
import { useUploadThing } from "@/lib/utils/uploadthing";
import { Loader2, Save, Building2, MapPin, Globe, Users, Trash2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

export default function EmployerProfile() {
  const { data: profile, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [deleteProfile, { isLoading: isDeleting }] = useDeleteProfileMutation();
  const { startUpload, isUploading } = useUploadThing("profileImage");

  const [form, setForm] = useState({
    companyName: "", companyWebsite: "", companySize: "", companyDescription: "",
    companyLogo: "", location: "", phone: ""
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (profile &&!initialized.current) {
      initialized.current = true;
      setForm({
        companyName: profile.companyName || "",
        companyWebsite: profile.companyWebsite || "",
        companySize: profile.companySize || "",
        companyDescription: profile.companyDescription || "",
        companyLogo: profile.companyLogo || "",
        location: profile.location || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
  if (!form.companyName) { toast.error("Company Name is required"); return; }
  try {
    const final = {...form };
    if (logoFile) {
      toast.loading("Uploading logo...");
      const res = await startUpload([logoFile]);
      if (!res?.[0]?.ufsUrl) throw new Error("Logo upload failed");
      final.companyLogo = res[0].ufsUrl;
      toast.dismiss();
    }
    await updateProfile(final).unwrap();
    // FIX: keep logo visible immediately
    setForm(final);
    setLogoPreview(final.companyLogo);
    setLogoFile(null);
    toast.success("Company profile saved!");
  } catch {
    toast.dismiss(); toast.error("Failed to save");
  }
};

  const handleClear = async () => {
    try {
      await deleteProfile().unwrap();
      toast.success("Company profile cleared");
      setShowDelete(false);
      setForm({ companyName: "", companyWebsite: "", companySize: "", companyDescription: "", companyLogo: "", location: "", phone: "" });
      setLogoPreview(""); setLogoFile(null);
      initialized.current = false;
    } catch {
      toast.error("Failed to clear");
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>;

  const isBusy = isUpdating || isUploading;
  const hasData =!!profile?.companyName ||!!profile?.companyLogo;

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8 mt-2 md:mt-4 mb-4 pb-18 lg:pb-8">
      {/* Banner */}
      <div className="bg-blue-600 text-white rounded-[20px] p-5 md:p-8 mb-5 md:mb-6 shadow-sm">
        <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2"><Building2 size={22}/> Company Profile</h1>
        <p className="text-blue-100 text-xs md:text-sm mt-1.5">Visible to jobseekers when you post jobs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 md:gap-6 items-start">
        {/* Logo Card - full width on mobile, 360px on desktop */}
        <div className="bg-white rounded-[20px] border border-gray-200 p-5 md:p-6 text-center h-fit lg:sticky lg:top-24">
          <h3 className="font-semibold text-left text-sm text-gray-900 mb-4">Company Logo</h3>
          <div className="w-28 h-28 md:w-32 md:h-32 mx-auto rounded-2xl bg-gray-50 overflow-hidden relative ring-4 ring-blue-50">
  {(logoPreview || form.companyLogo)? (
    <Image 
  src={logoPreview || form.companyLogo} 
  alt="logo" 
  fill 
  className="object-cover" 
  unoptimized
  priority
/>
  ) : (
    <div className="flex items-center justify-center h-full text-gray-400"><Building2 size={36} /></div>
  )}
</div>
          <label className="mt-5 block w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl cursor-pointer transition">
            Choose Logo
            <input type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files?.[0]; if (!f) return;
              setLogoFile(f); setLogoPreview(URL.createObjectURL(f));
            }} />
          </label>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[20px] border border-gray-200 p-4 sm:p-6 md:p-8 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wide text-gray-700">Company Name *</label>
              <input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="e.g. ITBS" className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-gray-700 flex items-center gap-1"><Globe size={12}/> Website</label>
              <input value={form.companyWebsite} onChange={e => setForm({...form, companyWebsite: e.target.value})} placeholder="phone-store.asia" className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-gray-700 flex items-center gap-1"><Users size={12}/> Company Size</label>
              <select value={form.companySize} onChange={e => setForm({...form, companySize: e.target.value})} className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:outline-none">
                <option value="">Select size</option><option>1-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>500+</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-gray-700 flex items-center gap-1"><MapPin size={12}/> Location</label>
              <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Lahore" className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-gray-700">Phone</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="03230000" className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wide text-gray-700">About Company</label>
              <textarea rows={4} value={form.companyDescription} onChange={e => setForm({...form, companyDescription: e.target.value})} placeholder="It's a very good company" className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:outline-none resize-none" />
            </div>
          </div>
          <button disabled={isBusy} onClick={handleSave} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition text-sm">
            {isBusy? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Save Company Profile
          </button>
        </div>
      </div>

      {hasData && (
        <div className="mt-6 mb-6 md:mb-8 bg-white rounded-[20px] border border-red-200 p-4 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-red-600 flex items-center gap-2"><Trash2 size={16}/> Clear Company Profile</h3>
              <p className="text-xs text-gray-500 mt-1">Deletes logo and all company fields. Login stays.</p>
            </div>
            <button onClick={() => setShowDelete(true)} className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition">
              <Trash2 size={14}/> Clear Profile
            </button>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h4 className="font-bold text-gray-900">Clear company profile?</h4>
            <p className="text-xs text-gray-600 mt-2">This will delete logo and all fields from DB and UploadThing.</p>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowDelete(false)} className="flex-1 border rounded-xl py-2.5 text-sm font-medium">Cancel</button>
              <button disabled={isDeleting} onClick={handleClear} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2">
                {isDeleting? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>} Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}