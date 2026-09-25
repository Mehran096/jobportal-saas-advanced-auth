"use client";
import { useState } from "react";
import { useGetReportsQuery, useUpdateReportStatusMutation, useDeleteReportMutation } from "@/lib/redux/api/reportApi";
import { useBanUserMutation } from "@/lib/redux/api/adminApi";
import { Loader2, Flag, Trash2, Check, X, Building, User, Mail } from "lucide-react";
import toast from "react-hot-toast";

type Filter = "all" | "pending" | "reviewed" | "dismissed";

export default function AdminReportsPage() {
  const { data, isLoading } = useGetReportsQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateReportStatusMutation();
  const [deleteReport] = useDeleteReportMutation();
  const [banUser, { isLoading: isBanning }] = useBanUserMutation();
  const [filter, setFilter] = useState<Filter>("pending");

  const reports = data?.reports || [];
  const filtered = filter === "all"? reports : reports.filter(r => r.status === filter);

  const handleAction = async (id: string, status: "reviewed" | "dismissed") => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Report ${status}`);
    } catch {
      toast.error("Failed");
    }
  };

  const handleBan = async (userId: string, reportId: string) => {
    try {
      await banUser({
        userId,
        reason: "Violation from report - " + new Date().toLocaleDateString(),
        action: "ban"
      }).unwrap();
      await updateStatus({ id: reportId, status: "reviewed" }).unwrap();
      toast.success("User banned & report reviewed");
    } catch {
      toast.error("Ban failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete report?")) return;
    try {
      await deleteReport(id).unwrap();
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <Flag className="text-red-600" /> Reports ({reports.length})
        </h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all","pending","reviewed","dismissed"] as Filter[]).map(f => (
            <button
              key={f}
              onClick={()=>setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize border transition ${
                filter===f? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}>
              {f} {f!=="all" && `(${reports.filter(r=>r.status===f).length})`}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.length===0 && <p className="text-center text-gray-500 py-10">No {filter} reports</p>}
          {filtered.map(r => (
            <div key={r._id} className="bg-white rounded-2xl border p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    r.status==="pending"? "bg-yellow-100 text-yellow-700" :
                    r.status==="reviewed"? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>{r.status}</span>
                  <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <button onClick={()=>handleDelete(r._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-700 flex gap-1 items-center"><User size={12}/> REPORTED USER</p>
                  <p className="font-semibold text-sm mt-1">
                    {r.reportedUser.firstName} {r.reportedUser.lastName}
                    {r.reportedUser.isBanned && <span className="text-red-600"> (BANNED)</span>}
                  </p>
                  <p className="text-xs text-gray-600 flex gap-1 items-center"><Mail size={10}/>{r.reportedUser.email} • {r.reportedUser.role}</p>
                  {r.jobId && <p className="text-xs mt-1 flex gap-1 items-center"><Building size={10}/> {typeof r.jobId==="object"? r.jobId.title : r.jobId}</p>}
                </div>
                <div className="bg-gray-50 border rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-700">REPORTED BY</p>
                  <p className="font-semibold text-sm mt-1">{r.reportedBy.firstName} {r.reportedBy.lastName}</p>
                  <p className="text-xs text-gray-600">{r.reportedBy.email}</p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-sm"><span className="font-semibold">Reason:</span> <span className="px-2 py-0.5 bg-gray-900 text-white rounded text-xs uppercase ml-1">{r.reason.replace("_"," ")}</span></p>
                {r.details && <p className="text-sm text-gray-700 mt-2 bg-yellow-50 border border-yellow-100 p-2 rounded-lg">{r.details}</p>}
              </div>

              {r.status==="pending" && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  <button
                    disabled={isBanning || isUpdating}
                    onClick={()=>handleBan(r.reportedUser._id, r._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {isBanning? "Banning..." : "Ban User & Review"}
                  </button>
                  <button onClick={()=>handleAction(r._id,"reviewed")} disabled={isUpdating} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 flex items-center gap-1 disabled:opacity-50"><Check size={14}/> Mark Reviewed</button>
                  <button onClick={()=>handleAction(r._id,"dismissed")} disabled={isUpdating} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50"><X size={14}/> Dismiss</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}