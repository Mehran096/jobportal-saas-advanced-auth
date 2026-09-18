"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, X, Clock, TrendingUp } from "lucide-react";

interface SearchSuggestionProps {
  value: string;
  onChange: (val: string) => void;
  allOptions: string[];
  placeholder?: string;
  type?: "title" | "location";
  recentKey?: string;
}

export default function SearchSuggestion({
  value,
  onChange,
  allOptions,
  placeholder = "Search...",
  type = "title",
  recentKey,
}: SearchSuggestionProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === "undefined" ||!recentKey) return [];
    try {
      const saved = window.localStorage.getItem(recentKey);
      return saved? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = type === "location"? MapPin : Search;

  const saveRecent = useCallback((val: string) => {
    if (!recentKey ||!val.trim()) return;
    setRecent((prev) => {
      const updated = [val,...prev.filter((r) => r!== val)].slice(0, 5);
      window.localStorage.setItem(recentKey, JSON.stringify(updated));
      return updated;
    });
  }, [recentKey]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current &&!ref.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlighted(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!value.trim()) return [];
    const q = value.toLowerCase();
    return allOptions.filter((o) => o.toLowerCase().includes(q)).slice(0, 6);
  }, [value, allOptions]);

  const popular = useMemo(() => allOptions.slice(0, 5), [allOptions]);
  const listToShow = value? filtered : popular;

  // combined list for keyboard nav: recent (if no value) + listToShow
  const flatList = useMemo(() => {
    if (!value && recent.length > 0) return [...recent,...listToShow];
    return listToShow;
  }, [value, recent, listToShow]);

  const handleSelect = (item: string) => {
    onChange(item);
    saveRecent(item);
    setOpen(false);
    setHighlighted(-1);
  };

  const clearRecent = () => {
    setRecent([]);
    if (recentKey) window.localStorage.removeItem(recentKey);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((prev) => (prev < flatList.length - 1? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((prev) => (prev > 0? prev - 1 : flatList.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted >= 0 && flatList[highlighted]) {
        handleSelect(flatList[highlighted]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
      inputRef.current?.blur();
    }
  };

  // scroll highlighted into view
  useEffect(() => {
    if (highlighted < 0) return;
    const el = document.getElementById(`sug-${recentKey}-${highlighted}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlighted, recentKey]);

  return (
    <div ref={ref} className="relative flex-1">
      <div className="relative flex items-center border rounded-lg px-3 bg-white focus-within:ring-2 focus-within:ring-blue-500">
        <Icon className="text-gray-400" size={18} />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlighted(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full py-2.5 px-2 outline-none text-sm"
        />
        {value && (
          <button onClick={() => onChange("")} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 max-h-[280px] overflow-y-auto">
            {recent.length > 0 &&!value && (
              <>
                <div className="flex items-center justify-between px-3 py-1.5">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase flex items-center gap-1"><Clock size={11} /> Recent</p>
                  <button onClick={clearRecent} className="text-[11px] text-blue-600 hover:underline">Clear</button>
                </div>
                {recent.map((r, idx) => (
                  <button
                    key={`recent-${r}`}
                    id={`sug-${recentKey}-${idx}`}
                    onClick={() => handleSelect(r)}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 text-sm ${highlighted === idx? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
                  >
                    <Clock size={14} className="text-gray-400" /> {r}
                  </button>
                ))}
                <div className="border-t my-2" />
              </>
            )}

            {listToShow.length > 0? (
              <>
                <p className="text-[11px] font-semibold text-gray-400 uppercase px-3 py-1.5 flex items-center gap-1">
                  {value? <><Search size={11} /> Suggestions</> : <><TrendingUp size={11} /> Popular</>}
                </p>
                {listToShow.map((item, i) => {
                  const realIdx =!value && recent.length > 0? i + recent.length : i;
                  const isActive = highlighted === realIdx;
                  return (
                    <button
                      key={item}
                      id={`sug-${recentKey}-${realIdx}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setHighlighted(realIdx)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 text-sm ${isActive? "bg-blue-50 text-blue-700 border border-blue-100" : "hover:bg-gray-50 border-transparent"}`}
                    >
                      <div className={`p-1.5 rounded-lg border ${isActive? "bg-white" : "bg-gray-50"}`}>
                        <Icon size={14} className={isActive? "text-blue-600" : "text-gray-500"} />
                      </div>
                      <span className="flex-1 truncate">{item}</span>
                    </button>
                  );
                })}
              </>
            ) : (
              <p className="text-sm text-gray-500 p-3 text-center">No results for &quot;{value}&quot;</p>
            )}
          </div>
          <div className="border-t px-3 py-1.5 text-[10px] text-gray-400 flex items-center justify-between">
            <span>↑↓ Navigate</span><span>↵ Select</span><span>Esc Close</span>
          </div>
        </div>
      )}
    </div>
  );
}