"use client";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

type Option = { label: string; value: string };
type Props = {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  variant?: "default" | "pill";
  widthClass?: string;
};

export default function CustomDropdown({ value, onChange, options, placeholder = "Select", variant = "default", widthClass = "w-20" }: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  const updatePos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
  };

  useLayoutEffect(() => {
    if (open) updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (ref.current &&!ref.current.contains(e.target as Node) &&!document.getElementById(`dd-${value}-${placeholder}`)?.contains(e.target as Node)) {
        if (btnRef.current &&!btnRef.current.contains(e.target as Node)) setOpen(false);
      }
    };
    const onScroll = () => updatePos();
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const active = value!== "";
  const currentLabel = options.find((o) => o.value === value)?.label || placeholder;

  const menu = open? (
    <div
      id={`dd-${value}-${placeholder}`}
      style={{ top: coords.top, left: coords.left, minWidth: variant === "pill"? 150 : coords.width }}
      className="fixed border border-gray-20 bg-white/95 backdrop-blur-sm rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-9999 overflow-hidden animate-in fade-in slide-in-from-top-1"
    >
      <div className="max-h-60 overflow-y-auto">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { onChange(opt.value); setOpen(false); }}
            className={`w-full text-left px-3 py-2.5 text-[13px] hover:bg-blue-50 active:bg-blue-100 ${value === opt.value? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-800"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  ) : null;

  if (variant === "pill") {
    return (
      <>
        <div ref={ref} className="relative shrink-0">
          <button
            ref={btnRef}
            type="button"
            onClick={() => setOpen(!open)}
            className={`px-3 py-1.5 sm:py-2 border rounded-full text-[12px] sm:text-[13px] font-medium flex items-center gap-1.5 whitespace-nowrap transition ${active? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 border-gray-200 text-gray-700"}`}
          >
            {currentLabel}
            <ChevronDown size={12} className={`shrink-0 transition-transform ${open? "rotate-180" : ""}`} />
          </button>
        </div>
        {typeof window!== "undefined" && createPortal(menu, document.body)}
      </>
    );
  }

  return (
    <>
      <div ref={ref} className={`relative ${widthClass}`}>
        <button ref={btnRef} type="button" onClick={() => setOpen(!open)} className="flex items-center justify-between border rounded-lg gap-2 px-3 h-10 w-full border-zinc-300 bg-white text-[13px] font-medium shadow-sm">
          <span className="truncate">{currentLabel}</span>
          <ChevronDown size={14} className={`shrink-0 transition-transform ${open? "rotate-180" : ""}`} />
        </button>
      </div>
      {typeof window!== "undefined" && createPortal(menu, document.body)}
    </>
  );
}