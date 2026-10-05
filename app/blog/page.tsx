"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useGetBlogsInfiniteQuery } from "@/lib/redux/api/blogApi";

const CATEGORIES = ["All", "Career Guide", "Interview Tips", "Freelancing", "Tech News"];

function isValidImageSrc(src: string | undefined): boolean {
  if (!src || src.length < 6) return false;
  return src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/") || src.startsWith("data:image");
}

export default function BlogListPage() {
  const [searchInput, setSearchInput] = useState<string>("");
  const [category, setCategory] = useState<string>("All");
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (val: string): void => {
    setSearchInput(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  const handleClearSearch = (): void => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleCategoryChange = (cat: string): void => {
    setCategory(cat);
    setPage(1);
  };

  const { data, isLoading, isFetching } = useGetBlogsInfiniteQuery({ search, category, page, limit: 9 });
  const blogs = data?.blogs || [];
  const total = data?.pagination.total || 0;
  const hasMore = data?.pagination.hasNext || false;
  const initialLoading = isLoading && page === 1;
  const loadingMore = isFetching && page > 1;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2">Career Blog</h1>
        <p className="text-gray-600 text-sm md:text-base">Latest guides for jobs in Pakistan 2026</p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search guides, tips, freelancing..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2.5 pr-20 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
          />
          <div className="absolute right-3 top-2.5 flex items-center gap-2">
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition"
              aria-label="Clear search"
            >
              <span className="text-[14px] font-bold leading-none">✕</span>
            </button>
          )}
          <span className="text-gray-400">🔍</span>
        </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => handleCategoryChange(cat)} className={`px-4 py-1.5 rounded-full text-xs md:text-sm whitespace-nowrap border transition ${category === cat? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-black"}`}>
              {cat}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">{total} guides found</p>
      </div>

      {initialLoading? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-xl overflow-hidden bg-white animate-pulse"><div className="h-48 bg-gray-200"></div></div>
          ))}
        </div>
      ) : blogs.length === 0? (
        <div className="text-center py-20 bg-white rounded-xl border"><p className="text-gray-500">No blogs found</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {blogs.map((blog, index) => (
              <Link key={blog._id} href={`/blog/${blog.slug}`} className="border rounded-xl overflow-hidden hover:shadow-lg transition bg-white group">
                <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                  {isValidImageSrc(blog.coverImage)? <Image src={blog.coverImage} alt={blog.title} fill className="object-cover group-hover:scale-105 transition duration-300" sizes="33vw" priority={index < 2} /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center"><span className="text-[11px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">{blog.category}</span><span className="text-[11px] text-gray-400">👁️ {blog.views}</span></div>
                  <h2 className="font-semibold mt-3 line-clamp-2 text-[15px]">{blog.title}</h2>
                  <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{blog.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button onClick={() => setPage((p) => p + 1)} disabled={isFetching} className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                {loadingMore? "Loading..." : `Load More (${blogs.length} of ${total})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}