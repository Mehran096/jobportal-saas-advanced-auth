"use client";
import { useState, useEffect } from "react";
import { useGetAllUsersAdminQuery, useBanUserMutation } from "@/lib/redux/api/adminApi";
import AdminPagination from "@/app/components/AdminPagination";
import { Loader2, X, Ban } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [banningId, setBanningId] = useState<string | null>(null);
  const [showBanModal, setShowBanModal] = useState<{ id: string; name: string } | null>(null);
  const [banReason, setBanReason] = useState("");
  const limit = 10;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useGetAllUsersAdminQuery({
    role,
    search: debouncedSearch,
    page,
    limit,
  });

  const [banUser] = useBanUserMutation();

  const parseError = (err: unknown) => {
    if (typeof err === "object" && err!== null && "data" in err) {
      return (err as { data?: { message?: string } }).data?.message || "Failed";
    }
    return err instanceof Error? err.message : "Failed";
  };

  const handleBanConfirm = async () => {
    if (!showBanModal) return;
    if (!banReason.trim()) {
      alert("Please enter ban reason");
      return;
    }
    try {
      setBanningId(showBanModal.id);
      await banUser({ userId: showBanModal.id, action: "ban", reason: banReason.trim() }).unwrap();
      setShowBanModal(null);
      setBanReason("");
    } catch (err: unknown) {
      alert(parseError(err));
    } finally {
      setBanningId(null);
    }
  };

  const handleUnban = async (id: string) => {
    if (!confirm("Unban this user?")) return;
    try {
      setBanningId(id);
      await banUser({ userId: id, action: "unban" }).unwrap();
    } catch (err: unknown) {
      alert(parseError(err));
    } finally {
      setBanningId(null);
    }
  };

  const showLoader = isLoading || isFetching;

  return (
    <div>
      <h1 className="text-xl font-bold">Manage Users</h1>
      <div className="flex gap-2 mt-4">
        <input
          placeholder="Search email/name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border rounded-xl px-4 py-2 text-sm w-60 focus:outline-none focus:ring-2 focus:ring-black/10"
        />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="border rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="">All Roles</option>
          <option value="jobseeker">Jobseeker</option>
          <option value="employer">Employer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className={`bg-white border rounded-2xl mt-4 overflow-x-auto transition ${showLoader? "opacity-60" : ""}`}>
        <table className="w-full text-sm min-w-150">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading? (
              <tr><td colSpan={5} className="p-6 text-center">Loading...</td></tr>
            ) : data?.users.length === 0? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">No users found</td></tr>
            ) : (
              data?.users.map((u) => (
                <tr key={u._id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">
                    {u.firstName} {u.lastName}
                    {u.isBanned && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">BANNED</span>}
                  </td>
                  <td className="p-3 text-gray-600">
                    <div>{u.email}</div>
                    {u.isBanned && u.bannedReason && (
                      <div className="text-[11px] text-red-500 mt-1 max-w-50 truncate">Reason: {u.bannedReason}</div>
                    )}
                  </td>
                  <td className="p-3 text-center"><span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">{u.role}</span></td>
                  <td className="p-3 text-center">
                    <span className={`text-[11px] px-2 py-1 rounded-full ${u.isBanned? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {u.isBanned? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {u.role === "admin"? (
                      <span className="text-xs text-gray-400">-</span>
                    ) : (
                      <button
                        disabled={banningId === u._id}
                        onClick={() => (u.isBanned? handleUnban(u._id) : setShowBanModal({ id: u._id, name: `${u.firstName} ${u.lastName}` }))}
                        className={`text-xs px-3 py-1 rounded-full font-medium disabled:opacity-50 flex items-center gap-1 mx-auto ${u.isBanned? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                      >
                        {banningId === u._id? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                        {banningId === u._id? "..." : u.isBanned? "Unban" : "Ban"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.pagination && (
        <AdminPagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} isLoading={showLoader} onPageChange={setPage} />
      )}

      {showBanModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm">Ban {showBanModal.name}?</h3>
              <button onClick={() => { setShowBanModal(null); setBanReason(""); }}><X size={16} /></button>
            </div>
            <p className="text-xs text-gray-500 mb-3">This will block login. User can appeal.</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter ban reason... e.g. Spam posting, fake jobs"
              className="w-full border rounded-xl p-3 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-black/10"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowBanModal(null); setBanReason(""); }} className="flex-1 border rounded-xl py-2 text-sm">Cancel</button>
              <button disabled={banningId!== null} onClick={handleBanConfirm} className="flex-1 bg-black text-white rounded-xl py-2 text-sm disabled:opacity-50">
                {banningId? "Banning..." : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}