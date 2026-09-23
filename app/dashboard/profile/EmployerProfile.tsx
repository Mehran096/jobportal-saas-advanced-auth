"use client";
import { useEffect, useState, useRef } from "react";
import { useGetProfileQuery, useUpdateProfileMutation } from "@/lib/redux/api/profileApi";
import { useUploadThing } from "@/lib/utils/uploadthing";
import { Loader2, Save, Building2, MapPin, Globe, Users } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

export default function EmployerProfile() {
  const { data: profile, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const { startUpload, isUploading } = useUploadThing("profileImage");

  const [form, setForm] = useState({
    companyName: "", companyWebsite: "", companySize: "", companyDescription: "",
    companyLogo: "", location: "", phone: ""
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
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
      toast.success("Company profile saved!");
      setLogoFile(null); setLogoPreview("");
    } catch {
      toast.dismiss(); toast.error("Failed to save");
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>;

  const isBusy = isUpdating || isUploading;

  return (
    <div className="max-w-6xl mx-auto mt-6 mb-16">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-[20px] p-6 md:p-8 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 /> Company Profile</h1>
        <p className="text-blue-100 text-sm mt-1">Visible to jobseekers when you post jobs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="bg-white rounded-[20px] border p-6 text-center h-fit">
          <h3 className="font-semibold text-left mb-4 text-sm">Company Logo</h3>
          <div className="w-32 h-32 mx-auto rounded-2xl bg-gray-50 overflow-hidden relative ring-4 ring-blue-50">
            {logoPreview? <Image src={logoPreview} alt="logo" fill className="object-cover" unoptimized />
            : form.companyLogo? <Image src={form.companyLogo} alt="logo" fill className="object-cover" unoptimized />
            : <div className="flex items-center justify-center h-full text-gray-400"><Building2 size={40} /></div>}
          </div>
          <label className="mt-5 block w-full bg-blue-600 text-white text-sm py-2.5 rounded-xl cursor-pointer">
            Choose Logo
            <input type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files?.[0]; if (!f) return;
              setLogoFile(f); setLogoPreview(URL.createObjectURL(f));
            }} />
          </label>
        </div>

        <div className="bg-white rounded-[20px] border p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="text-[11px] font-bold uppercase">Company Name *</label><input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="mt-2 w-full border rounded-xl px-4 py-3 text-sm bg-gray-50" placeholder="e.g. Acme Inc" /></div>
            <div><label className="text-[11px] font-bold uppercase flex items-center gap-1"><Globe size={12}/> Website</label><input value={form.companyWebsite} onChange={e => setForm({...form, companyWebsite: e.target.value})} className="mt-2 w-full border rounded-xl px-4 py-3 text-sm bg-gray-50" placeholder="https://..." /></div>
            <div><label className="text-[11px] font-bold uppercase flex items-center gap-1"><Users size={12}/> Company Size</label><select value={form.companySize} onChange={e => setForm({...form, companySize: e.target.value})} className="mt-2 w-full border rounded-xl px-4 py-3 text-sm bg-gray-50"><option value="">Select size</option><option>1-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>500+</option></select></div>
            <div><label className="text-[11px] font-bold uppercase flex items-center gap-1"><MapPin size={12}/> Location</label><input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="mt-2 w-full border rounded-xl px-4 py-3 text-sm bg-gray-50" /></div>
            <div><label className="text-[11px] font-bold uppercase">Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-2 w-full border rounded-xl px-4 py-3 text-sm bg-gray-50" /></div>
            <div className="sm:col-span-2"><label className="text-[11px] font-bold uppercase">About Company</label><textarea rows={5} value={form.companyDescription} onChange={e => setForm({...form, companyDescription: e.target.value})} className="mt-2 w-full border rounded-xl px-4 py-3 text-sm bg-gray-50 resize-none" placeholder="What does your company do?" /></div>
          </div>
          <button disabled={isBusy} onClick={handleSave} className="mt-6 w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
            {isBusy? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Save Company Profile
          </button>
        </div>
      </div>
    </div>
  );
}