"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, FormEvent } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  useGetMyAccountQuery,
  useUpdateMyAccountMutation,
  useDeleteMyAccountMutation
} from "@/lib/redux/api/authApi";
import DashboardHeader from "@/app/components/DashboardHeader";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
}
interface ApiError { data?: { message?: string }; }
type Provider = "credentials" | "google" | "both";

function Skeleton() {
  return (
    <>
      <DashboardHeader />
      <div className="max-w-xl mx-auto p-3 sm:p-6 space-y-4 animate-pulse pb-20">
        <div className="h-6 w-40 bg-gray-200 rounded-lg"></div>
        <div className="h-3 w-28 bg-gray-100 rounded"></div>
        <div className="space-y-3 border p-4 rounded-xl bg-white">
          <div className="h-11 w-full bg-gray-200 rounded-xl"></div>
          <div className="h-11 w-full bg-gray-200 rounded-xl"></div>
          <div className="h-11 w-full bg-gray-200 rounded-xl"></div>
          <div className="h-12 w-full bg-gray-300 rounded-xl"></div>
        </div>
      </div>
    </>
  );
}

export default function MyAccountPage() {
  const { data, isLoading } = useGetMyAccountQuery();
  const { update } = useSession();
  const [updateMyAccount, { isLoading: saving }] = useUpdateMyAccountMutation();
  const [deleteMyAccount, { isLoading: deleting }] = useDeleteMyAccountMutation();

  const [form, setForm] = useState<FormState>({ firstName: "", lastName: "", email: "" });

  useEffect(() => {
    if (data?.user) {
      setForm({
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email
      });
    }
  }, [data]);

  if (isLoading) return <Skeleton />;

  const provider = data?.user?.provider as Provider;
  const isGoogleLinked = provider === "google" || provider === "both";

  const onUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = isGoogleLinked
       ? { firstName: form.firstName, lastName: form.lastName }
        : form;
      const res = await updateMyAccount(payload as FormState).unwrap();
      await update({
        firstName: res.user.firstName,
        lastName: res.user.lastName,
        email: res.user.email,
      });
      toast.success("Account updated successfully!");
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Update failed");
    }
  };

  const onDelete = async () => {
    if (!confirm("Are you sure? All your data will be deleted permanently.")) return;
    try {
      await deleteMyAccount().unwrap();
      toast.success("Account deleted");
      await signOut({ callbackUrl: "/" });
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Delete failed");
    }
  };

  return (
    <>
      <DashboardHeader />
      <div className="max-w-xl mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-24">
        {/* Header - small on mobile */}
        <div>
          <h1 className="text-[16px] sm:text-xl font-bold tracking-tight flex items-center gap-2">
            My Account
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black text-white font-semibold capitalize">{data?.user.role}</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-zinc-500 mt-1 capitalize">
            {provider === "both"? "Password + Google (Linked)" : provider} account
          </p>
        </div>

        <form onSubmit={onUpdate} className="space-y-3 sm:space-y-4 border border-zinc-200 p-3.5 sm:p-5 rounded-2xl bg-white shadow-sm">
          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-medium text-zinc-600">First Name</label>
            <input
              placeholder="First name"
              value={form.firstName}
              onChange={(e) => setForm({...form, firstName: e.target.value })}
              className="w-full border border-zinc-300 px-3.5 py-3 sm:py-2.5 rounded-xl text-[16px] sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-medium text-zinc-600">Last Name</label>
            <input
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => setForm({...form, lastName: e.target.value })}
              className="w-full border border-zinc-300 px-3.5 py-3 sm:py-2.5 rounded-xl text-[16px] sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-medium text-zinc-600">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>!isGoogleLinked && setForm({...form, email: e.target.value })}
              readOnly={isGoogleLinked}
              className={`w-full border border-zinc-300 px-3.5 py-3 sm:py-2.5 rounded-xl text-[16px] sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${isGoogleLinked? "bg-zinc-100 cursor-not-allowed text-zinc-500" : ""}`}
            />
            {isGoogleLinked && (
              <p className="text-[10px] text-zinc-400 mt-1">Email cannot be changed for Google-linked accounts</p>
            )}
          </div>

          <button disabled={saving} className="bg-black text-white px-5 h-11 sm:h-10.5 rounded-xl w-full text-[13px] font-semibold disabled:opacity-50 active:scale-[0.98] transition">
            {saving? "Saving..." : "Update Account"}
          </button>
        </form>

        <div className="border border-red-200 bg-red-50/80 p-3.5 sm:p-5 rounded-2xl">
          <h3 className="font-bold text-red-700 text-[13px] sm:text-sm">Danger Zone</h3>
          <p className="text-[11px] sm:text-xs text-red-500/80 mt-1">This will permanently delete your account and all data.</p>
          <button onClick={onDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white px-5 h-11 sm:h-10.5 rounded-xl w-full mt-3 text-[13px] font-semibold disabled:opacity-50 active:scale-[0.98] transition">
            {deleting? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </div>
      <DashboardMobileNav />
    </>
  );
}