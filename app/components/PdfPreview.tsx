"use client";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// FIX: Use jsdelivr - more stable on Vercel than unpkg
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfPreview({ file }: { file: string }) {
  const [numPages, setNumPages] = useState(0);

  return (
    <div className="bg-gray-50 max-h-[600px] overflow-auto flex flex-col items-center p-2">
      <Document
        file={file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={(e) => console.error("PDF load error", e)}
        loading={
          <div className="p-10 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-blue-600" />
            <span className="text-xs text-gray-400">Loading CV...</span>
          </div>
        }
        error={
          <div className="p-10 text-center">
            <p className="text-xs text-red-500 mb-2">Preview failed</p>
            <a href={file} target="_blank" className="text-xs bg-blue-600 text-white px-4 py-2 rounded-xl">Open PDF</a>
          </div>
        }
        options={{
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
          standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
        }}
      >
        {Array.from(new Array(Math.min(numPages || 1, 3)), (_, i) => (
          <Page
            key={`page_${i+1}`}
            pageNumber={i+1}
            width={320}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mb-2 shadow-sm bg-white"
          />
        ))}
      </Document>
      {numPages > 1 && <p className="text-[10px] text-gray-400 mt-1">{numPages} pages • showing first 3</p>}
    </div>
  );
}