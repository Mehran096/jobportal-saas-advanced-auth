"use client";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfPreview({ file }: { file: string }) {
  const [numPages, setNumPages] = useState(1);
  return (
    <div className="bg-gray-50 max-h-[600px] overflow-auto flex flex-col items-center p-2">
      <Document
        file={file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<div className="p-10 flex flex-col items-center gap-2"><Loader2 className="animate-spin text-blue-600"/><span className="text-xs text-gray-400">Loading CV...</span></div>}
        error={<div className="p-10 text-center"><p className="text-xs text-red-500">Failed to load PDF</p></div>}
      >
        {Array.from(new Array(Math.min(numPages, 3)), (_, i) => (
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
    </div>
  );
}