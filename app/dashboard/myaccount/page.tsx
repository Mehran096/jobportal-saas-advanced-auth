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

interface ApiError {
  data?: { message?: string };
}

type Provider = "credentials" | "google" | "both";

function Skeleton() {
  return (
    <>
      <DashboardHeader />
      <div className="max-w-xl mx-auto p-6 space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-gray-200 rounded-lg"></div>
        <div className="h-4 w-40 bg-gray-100 rounded"></div>

        <div className="space-y-4 border p-5 rounded-xl bg-white">
          <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
          <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
          <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
          <div className="h-11 w-full bg-gray-300 rounded-lg"></div>
        </div>

        <div className="border border-red-200 bg-red-50 p-5 rounded-xl">
          <div className="h-5 w-32 bg-red-200 rounded"></div>
          <div className="h-10 w-full bg-red-200 rounded-lg mt-3"></div>
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
      <div className="max-w-xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">My Account - {data?.user.role}</h1>
        <p className="text-sm text-gray-500">
          {provider === "both"? "Password + Google (Linked)" : provider}
        </p>

        <form onSubmit={onUpdate} className="space-y-4 border p-5 rounded-xl bg-white">
          <input
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) => setForm({...form, firstName: e.target.value })}
            className="w-full border px-3 py-2 rounded-lg"
          />
          <input
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => setForm({...form, lastName: e.target.value })}
            className="w-full border px-3 py-2 rounded-lg"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) =>!isGoogleLinked && setForm({...form, email: e.target.value })}
            readOnly={isGoogleLinked}
            className={`w-full border px-3 py-2 rounded-lg ${isGoogleLinked? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
          {isGoogleLinked && (
            <p className="text-xs text-gray-400">Email cannot be changed for Google-linked accounts</p>
          )}
          <button disabled={saving} className="bg-black text-white px-5 py-2 rounded-lg w-full disabled:opacity-50">
            {saving? "Saving..." : "Update Account"}
          </button>
        </form>

        <div className="border border-red-300 bg-red-50 p-5 rounded-xl">
          <h3 className="font-bold text-red-700">Danger Zone</h3>
          <p className="text-xs text-red-500 mt-1">This will permanently delete your account.</p>
          <button onClick={onDelete} disabled={deleting} className="bg-red-600 text-white px-5 py-2 rounded-lg w-full mt-2 disabled:opacity-50">
            {deleting? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </div>
      <DashboardMobileNav />
    </>
  );
}