"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface Blog {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  category: string;
  views: number;
  createdAt: string;
}

const CATEGORIES = ["All", "Career Guide", "Interview Tips", "Freelancing", "Tech News"];

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchBlogs = useCallback(async (pageNum: number, currentSearch: string, currentCategory: string, reset = false) => {
    try {
      if (reset) setInitialLoading(true);
      else setLoading(true);

      const params = new URLSearchParams();
      if (currentSearch) params.append("search", currentSearch);
      if (currentCategory && currentCategory!== "All") params.append("category", currentCategory);
      params.append("page", pageNum.toString());
      params.append("limit", "9");

      const res = await fetch(`/api/blogs?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        if (reset) setBlogs(data.blogs);
        else setBlogs((prev) => [...prev,...data.blogs]);
        setTotal(data.pagination.total);
        setHasMore(data.pagination.hasNext);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  // Initial + search/category - this IS supposed to set state, so we disable that specific rule
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBlogs(1, search, category, true);
    setPage(1); 
  }, [search, category, fetchBlogs]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBlogs(nextPage, search, category, false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2">Career Blog</h1>
        <p className="text-gray-600 text-sm md:text-base">Latest guides for jobs in Pakistan 2026</p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative max-w-md">
          <input type="text" placeholder="Search guides, tips, freelancing..." value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} className="w-full px-4 py-2.5 pr-10 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white" />
          <span className="absolute right-3.5 top-2.5 text-gray-400">🔍</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => handleCategoryChange(cat)} className={`px-4 py-1.5 rounded-full text-xs md:text-sm whitespace-nowrap border transition ${category === cat? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-black"}`}>
              {cat}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">{!initialLoading && `${total} guides found`}</p>
      </div>

      {initialLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-xl overflow-hidden bg-white animate-pulse"><div className="h-48 bg-gray-200"></div><div className="p-4 space-y-3"><div className="h-4 bg-gray-200 rounded w-1/3"></div><div className="h-4 bg-gray-200 rounded w-full"></div></div></div>
          ))}
        </div>
      )}

      {!initialLoading && blogs.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border">
          <p className="text-gray-500">No blogs found for &quot;{search}&quot; {category!== "All" && `in ${category}`}.</p>
          <button onClick={() => { setSearchInput(""); setCategory("All"); }} className="mt-3 text-sm text-blue-600 underline">Clear filters</button>
        </div>
      )}

      {!initialLoading && blogs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {blogs.map((blog, index) => (
            <Link key={blog._id} href={`/blog/${blog.slug}`} className="border rounded-xl overflow-hidden hover:shadow-lg transition bg-white group">
              <div className="relative w-full h-48 overflow-hidden"><Image src={blog.coverImage} alt={blog.title} fill className="object-cover group-hover:scale-105 transition duration-300" sizes="33vw" priority={index < 2} loading={index < 2 ? "eager" : "lazy"}/></div>
              <div className="p-4">
                <div className="flex justify-between items-center"><span className="text-[11px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">{blog.category}</span><span className="text-[11px] text-gray-400">👁️ {blog.views}</span></div>
                <h2 className="font-semibold mt-3 line-clamp-2 text-[15px] leading-snug group-hover:text-blue-600 transition">{blog.title}</h2>
                <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{blog.excerpt}</p>
                <p className="text-xs text-gray-400 mt-3">{new Date(blog.createdAt).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore && blogs.length > 0 && (
        <div className="flex justify-center mt-8">
          <button onClick={handleLoadMore} disabled={loading} className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
            {loading? "Loading..." : `Load More Guides (${blogs.length} of ${total})`}
          </button>
        </div>
      )}
    </div>
  );
}