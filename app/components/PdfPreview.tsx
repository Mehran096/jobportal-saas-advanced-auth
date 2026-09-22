"use client";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Indeed uses jsdelivr — most stable on Vercel mobile
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfPreview({ file }: { file: string }) {
  const [numPages, setNumPages] = useState(0);

  return (
    <div className="bg-[#f1f5f9] w-full flex flex-col items-center p-2 sm:p-4">
      <Document
        file={file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={(e) => console.error("PDF error", e)}
        loading={
          <div className="p-10 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-blue-600" />
            <span className="text-xs text-gray-500">Loading CV...</span>
          </div>
        }
        error={
          <div className="p-10 text-center">
            <p className="text-xs text-red-500 mb-3">Preview failed</p>
            <a href={file} target="_blank" className="text-xs bg-blue-600 text-white px-5 py-2.5 rounded-xl">Open PDF</a>
          </div>
        }
        options={{
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
          standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
        }}
      >
        {/* Render ALL pages like Indeed screenshot */}
        {Array.from(new Array(numPages || 1), (_, i) => (
          <Page
            key={`page_${i+1}`}
            pageNumber={i+1}
            // Indeed width = full screen on mobile
            width={typeof window!== "undefined"? Math.min(800, window.innerWidth - 24) : 350}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mb-4 shadow-md bg-white rounded-sm"
          />
        ))}
      </Document>
      {numPages > 0 && <p className="text-[10px] text-gray-400 py-2">{numPages} page{numPages>1?'s':''}</p>}
    </div>
  );
}