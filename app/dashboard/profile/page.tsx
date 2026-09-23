"use client";
import { Suspense } from "react";
import { useGetProfileQuery } from "@/lib/redux/api/profileApi";
import DashboardHeader from "@/app/components/DashboardHeader";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";
import { Loader2 } from "lucide-react";
import JobseekerProfile from "./JobseekerProfile";
import EmployerProfile from "./EmployerProfile";

function ProfileWrapper() {
  const { data: profile, isLoading } = useGetProfileQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return profile?.role === "employer" ? <EmployerProfile /> : <JobseekerProfile />;
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <DashboardHeader />
      <Suspense fallback={<div className="p-20 text-center"><Loader2 className="animate-spin text-blue-600" /></div>}>
        <ProfileWrapper />
      </Suspense>
      <DashboardMobileNav />
    </div>
  );
}