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

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" size={22} /></div>;

  const isBusy = isUpdating || isUploading;
  const hasData =!!profile?.companyName ||!!profile?.companyLogo;

  return (
    <div className="w-full max-w-6xl mx-auto px-0 sm:px-4 pb-24 sm:pb-6">
      {/* Banner compact */}
      <div className="mx-3 sm:mx-0 mt-3 sm:mt-4 bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-2xl p-4 sm:p-6 shadow-sm">
        <h1 className="text-[15px] sm:text-[20px] font-bold flex items-center gap-2"><Building2 size={16}/> Company Profile</h1>
        <p className="text-blue-100 text-[11px] sm:text-[13px] mt-1 leading-snug">Visible to jobseekers when you post jobs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 sm:gap-5 mt-3 px-3 sm:px-0 items-start">
        {/* Logo Card compact */}
        <div className="bg-white sm:border sm:rounded-2xl border-y sm:border-gray-100 p-4 shadow-sm sm:shadow-sm text-center h-fit lg:sticky lg:top-20">
          <h3 className="font-semibold text-left text-[12px] text-gray-900 mb-3">Company Logo</h3>
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl bg-gray-50 overflow-hidden relative ring-2 ring-blue-50">
            {(logoPreview || form.companyLogo)? (
              <Image src={logoPreview || form.companyLogo} alt="logo" fill className="object-cover" unoptimized priority />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400"><Building2 size={26} /></div>
            )}
          </div>
          <label className="mt-3 block w-full bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium py-2 rounded-xl cursor-pointer transition">
            Choose Logo
            <input type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files?.[0]; if (!f) return;
              setLogoFile(f); setLogoPreview(URL.createObjectURL(f));
            }} />
          </label>
        </div>

        {/* Form Card compact */}
        <div className="bg-white sm:border sm:rounded-2xl border-y sm:border-gray-100 p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase text-gray-500">Company Name *</label>
              <input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="e.g. ITBS" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] bg-gray-50/50 outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1"><Globe size={10}/> Website</label>
              <input value={form.companyWebsite} onChange={e => setForm({...form, companyWebsite: e.target.value})} placeholder="www.company.com" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] bg-gray-50/50 outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1"><Users size={10}/> Size</label>
              <select value={form.companySize} onChange={e => setForm({...form, companySize: e.target.value})} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] bg-gray-50/50 outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Select size</option><option>1-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>500+</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1"><MapPin size={10}/> Location</label>
              <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Lahore" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] bg-gray-50/50 outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500">Phone</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="0323xxxx" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] bg-gray-50/50 outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase text-gray-500">About Company</label>
              <textarea rows={3} value={form.companyDescription} onChange={e => {
                setForm({...form, companyDescription: e.target.value });
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }} placeholder="Company description..." className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] bg-gray-50/50 outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-17.5 max-h-40 overflow-y-auto" />
            </div>
          </div>
          <button disabled={isBusy} onClick={handleSave} className="mt-4 w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition text-[13px]">
            {isBusy? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save Company Profile
          </button>
        </div>
      </div>

      {hasData && (
        <div className="mx-3 sm:mx-0 mt-3 bg-white sm:border border-y sm:border-red-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div>
              <h3 className="text-[12px] font-bold text-red-600 flex items-center gap-1.5"><Trash2 size={14}/> Clear Company Profile</h3>
              <p className="text-[11px] text-gray-500 mt-1">Deletes logo and fields. Login stays.</p>
            </div>
            <button onClick={() => setShowDelete(true)} className="w-full sm:w-auto shrink-0 bg-red-500 hover:bg-red-600 text-white text-[12px] font-medium px-5 py-2 rounded-xl flex items-center justify-center gap-1.5">
              <Trash2 size={12}/> Clear Profile
            </button>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
            <h4 className="font-bold text-[14px]">Clear company profile?</h4>
            <p className="text-[11px] text-gray-600 mt-1.5">This will delete logo and fields from DB.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowDelete(false)} className="flex-1 border rounded-xl py-2 text-[12px]">Cancel</button>
              <button disabled={isDeleting} onClick={handleClear} className="flex-1 bg-red-600 text-white rounded-xl py-2 text-[12px] flex items-center justify-center gap-1.5">
                {isDeleting? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>} Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}