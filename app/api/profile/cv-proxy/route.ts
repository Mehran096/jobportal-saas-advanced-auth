import { NextRequest } from "next/server";

export const runtime = 'nodejs'; // IMPORTANT for Vercel
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new Response("Missing url", { status: 400 });

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return new Response("Failed to fetch PDF", { status: 500 });
    
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=cv.pdf",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("cv-proxy error", e);
    return new Response("Proxy error", { status: 500 });
  }
}