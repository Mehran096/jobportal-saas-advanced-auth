"use client";

import { useState } from "react";
import { useGetAppealsQuery, useReviewAppealMutation } from "@/lib/redux/api/adminApi";
import { Loader2, Check, X, Mail, Calendar, AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function AppealsPage() {
  const { data, isLoading, isError } = useGetAppealsQuery();
  const [reviewAppeal, { isLoading: isReviewing }] = useReviewAppealMutation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const appeals = data?.appeals || [];
  const pendingAppeals = appeals.filter((a) => a.status === "pending");

  const handleDecision = async (id: string, decision: "approved" | "rejected") => {
    try {
      setSelectedId(id);
      await reviewAppeal({
        id,
        decision,
        adminNote: notes[id]?.trim() || ""
      }).unwrap();
      setNotes((prev) => ({...prev, [id]: "" }));
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err!== null && "data" in err
         ? (err as { data?: { message?: string } }).data?.message
          : err instanceof Error
         ? err.message
          : "Failed to review";
      alert(message);
    } finally {
      setSelectedId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-sm">
        <Loader2 className="animate-spin" size={18} /> Loading appeals...
      </div>
    );
  }

  if (isError) {
    return <div className="p-6 text-sm text-red-600">Failed to load appeals</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Ban Appeals</h1>
        <p className="text-xs text-gray-500 mt-1">{pendingAppeals.length} pending appeal(s)</p>
      </div>

      {pendingAppeals.length === 0? (
        <div className="bg-white rounded-2xl p-12 text-center border">
          <div className="w-12 h-12 bg-green-50 rounded-full grid place-items-center mx-auto mb-3">
            <Check size={20} className="text-green-600" />
          </div>
          <p className="text-sm font-medium">No pending appeals</p>
          <p className="text-xs text-gray-400 mt-1">All caught up!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingAppeals.map((appeal) => (
            <div key={appeal._id} className="bg-white rounded-2xl p-5 border shadow-sm">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-sm font-semibold">
                    {appeal.userId.firstName} {appeal.userId.lastName}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Mail size={12} /> {appeal.email} • {appeal.userId.role}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar size={12} /> {new Date(appeal.createdAt).toLocaleString()}
                  </p>
                  <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                      <AlertTriangle size={12} /> Ban Reason:
                    </p>
                    <p className="text-xs text-red-700 mt-1">{appeal.userId.bannedReason || "Violated terms"}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium capitalize">
                  {appeal.status}
                </span>
              </div>

              <div className="mt-4 bg-gray-50 rounded-xl p-3">
                <p className="text-[11px] font-medium text-gray-500">Appeal Message:</p>
                <p className="text-sm mt-1 text-gray-800">{appeal.message}</p>
              </div>

              <div className="mt-4">
                <input
                  placeholder="Admin note (optional)"
                  value={notes[appeal._id] || ""}
                  onChange={(e) => setNotes((prev) => ({...prev, [appeal._id]: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  disabled={isReviewing && selectedId === appeal._id}
                  onClick={() => handleDecision(appeal._id, "approved")}
                  className="flex-1 bg-black text-white rounded-xl py-2.5 text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isReviewing && selectedId === appeal._id? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Approve & Unban
                </button>
                <button
                  disabled={isReviewing && selectedId === appeal._id}
                  onClick={() => handleDecision(appeal._id, "rejected")}
                  className="flex-1 bg-white border text-red-600 rounded-xl py-2.5 text-xs font-medium hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <X size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}