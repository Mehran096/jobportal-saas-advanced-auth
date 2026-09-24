"use client";
import { useState, useEffect } from "react";
import { useGetAllJobsAdminQuery, useDeleteJobAdminMutation } from "@/lib/redux/api/adminApi";
import AdminPagination from "@/app/components/AdminPagination";
import { Trash2, Loader2 } from "lucide-react";

export default function AdminJobsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useGetAllJobsAdminQuery({ search: debouncedSearch, page, limit });
  const [deleteJob] = useDeleteJobAdminMutation();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    try {
      setDeletingId(id);
      await deleteJob(id).unwrap();
    } finally {
      setDeletingId(null);
    }
  };

  const showLoader = isLoading || isFetching;

  return (
    <div>
      <h1 className="text-xl font-bold">Manage Jobs</h1>
      <div className="flex gap-2 mt-4">
        <input placeholder="Search title / company / location..." value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded-xl px-4 py-2 text-sm w-[300px]" />
      </div>

      <div className={`bg-white border rounded-2xl mt-4 overflow-x-auto transition ${showLoader? "opacity-60" : ""}`}>
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="p-3 text-left">Title</th><th className="p-3 text-left">Company</th><th className="p-3 text-left">Posted By</th><th className="p-3">Action</th></tr></thead>
          <tbody>
            {isLoading? <tr><td colSpan={4} className="p-6 text-center">Loading...</td></tr> :
              data?.jobs.map((j) => (
                <tr key={j._id} className="border-t hover:bg-gray-50">
                  <td className="p-3"><p className="font-medium">{j.title}</p><p className="text-xs text-gray-400">{j.location}</p></td>
                  <td className="p-3">{j.company}</td>
                  <td className="p-3 text-xs"><p className="font-medium">{j.postedBy?.firstName}</p><p className="text-gray-400">{j.postedBy?.email}</p></td>
                  <td className="p-3 text-center">
                    <button disabled={deletingId === j._id} onClick={() => handleDelete(j._id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50">
                      {deletingId === j._id? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {data?.pagination && (
        <AdminPagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} isLoading={showLoader} onPageChange={setPage} />
      )}
    </div>
  );
}