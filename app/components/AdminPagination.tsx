"use client";

interface AdminPaginationProps {
  page: number;
  pages: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

export default function AdminPagination({ page, pages, total, isLoading, onPageChange }: AdminPaginationProps) {
  if (pages <= 1 &&!isLoading) return null;

  const getVisiblePages = () => {
    const range: (number | string)[] = [];
    const delta = 1;
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      } else if (range[range.length - 1]!== "...") {
        range.push("...");
      }
    }
    return range;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 px-1">
      <div className="text-sm text-gray-500">
        {isLoading? (
          <span className="animate-pulse">Loading...</span>
        ) : (
          <>
            <span className="font-medium text-gray-900">{total}</span> results • Page{" "}
            <span className="font-medium text-gray-900">{page}</span> of{" "}
            <span className="font-medium text-gray-900">{pages}</span>
          </>
        )}
      </div>

      <div className={`flex items-center gap-1 ${isLoading? "opacity-50 pointer-events-none" : ""}`}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className="h-8 px-3 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Prev
        </button>

        {getVisiblePages().map((p, idx) =>
          typeof p === "string"? (
            <span key={`d-${idx}`} className="px-2 text-gray-400 text-sm">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              disabled={isLoading}
              className={`h-8 min-w-[32px] px-2 text-sm font-medium border rounded-lg ${
                page === p? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages || isLoading}
          className="h-8 px-3 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}