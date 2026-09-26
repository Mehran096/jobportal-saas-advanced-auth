"use client";
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const menuWidth = variant === "pill"? 160 : r.width;
    const padding = 12;
    let left = r.left;
    if (r.left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }
    if (left < padding) left = padding;
    setCoords({ top: r.bottom + 8, left, width: r.width });
  }, [variant]);

  useLayoutEffect(() => {
    if (open) updatePos();
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open, updatePos]);

  const active = value!== "";
  const currentLabel = options.find((o) => o.value === value)?.label || placeholder;

  const menu = open? (
    <div
      ref={menuRef}
      style={{ top: coords.top, left: coords.left, minWidth: variant === "pill"? 160 : coords.width }}
      className="fixed bg-white border border-gray-200 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-9999 overflow-hidden"
    >
      <div className="max-h-60 overflow-y-auto">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { onChange(opt.value); setOpen(false); }}
            className={`w-full text-left px-3 py-2.5 text-[13px] hover:bg-blue-50 ${value === opt.value? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-800"}`}
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
        <div className="relative shrink-0">
          <button
            ref={btnRef}
            type="button"
            onClick={() => setOpen(!open)}
            className={`border rounded-full font-medium flex items-center gap-1 whitespace-nowrap transition leading-none px-2.5 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-[13px] sm:leading-normal ${active? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 border-gray-200 text-gray-700"}`}
          >
            {currentLabel}
            <ChevronDown size={10} className={`sm:hidden shrink-0 transition-transform duration-200 ${open? "rotate-180" : ""}`} />
            <ChevronDown size={12} className={`hidden sm:block shrink-0 transition-transform duration-200 ${open? "rotate-180" : ""}`} />
          </button>
        </div>
        {typeof window!== "undefined" && createPortal(menu, document.body)}
      </>
    );
  }

  return (
    <>
      <div className={`relative ${widthClass}`}>
        <button ref={btnRef} type="button" onClick={() => setOpen(!open)} className="flex items-center justify-between border rounded-lg gap-2 px-3 h-10 w-full border-zinc-300 bg-white text-[13px] font-medium shadow-sm">
          <span className="truncate">{currentLabel}</span>
          <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${open? "rotate-180" : ""}`} />
        </button>
      </div>
      {typeof window!== "undefined" && createPortal(menu, document.body)}
    </>
  );
}