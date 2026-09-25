"use client";
import { useGetAdminStatsQuery } from "@/lib/redux/api/adminApi";
import { Users, Building2, Briefcase, FileText } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function AdminOverview() {
  const { data, isLoading } = useGetAdminStatsQuery();

  if (isLoading) return <div className="p-10 text-sm">Loading stats...</div>;
  if (!data) return <div className="p-10 text-sm">Failed to load. Login as admin.</div>;

  const cards = [
    { label: "Total Users", value: data.totalUsers, sub: `${data.totalJobseekers} jobseekers`, icon: Users, bg: "bg-blue-50 text-blue-600" },
    { label: "Employers", value: data.totalEmployers, sub: "companies", icon: Building2, bg: "bg-purple-50 text-purple-600" },
    { label: "Total Jobs", value: data.totalJobs, sub: "active listings", icon: Briefcase, bg: "bg-green-50 text-green-600" },
    { label: "Applications", value: data.totalApplications, sub: "total applied", icon: FileText, bg: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-gray-500 mt-1">JobPortal SaaS overview</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}><c.icon size={18} /></div>
            <p className="text-2xl font-bold mt-4">{c.value}</p>
            <p className="text-sm font-medium">{c.label}</p>
            <p className="text-xs text-gray-400">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-2xl p-5 mt-6">
        <h3 className="font-semibold text-sm mb-4">Recent Users</h3>
        <div className="space-y-3">
          {data.recentUsers?.map((u) => (
            <div key={u._id} className="flex justify-between text-sm border-b last:border-0 pb-2">
              <span>{u.firstName} {u.lastName} <span className="text-gray-400 text-xs">({u.role})</span></span>
              <span className="text-xs text-gray-500">{u.email}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}