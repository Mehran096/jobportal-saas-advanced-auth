export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";

interface BlogQuery {
  status?: string;
  category?: string;
  $text?: { $search: string };
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    
    const filter: BlogQuery = { status: "published" };
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const blogs = await Blog.find(filter)
      .populate("author", "name email image")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json(
      { success: true, blogs },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json() as {
      title: string;
      excerpt: string;
      content: string;
      slug?: string;
      coverImage?: string;
      author: string;
      category?: string;
      tags?: string[];
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[];
      ogImage?: string;
    };

    let slug = body.slug;
    if (!slug && body.title) {
      slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString().slice(-4);
    }

    const metaTitle = body.metaTitle || body.title?.substring(0, 60);
    const metaDescription = body.metaDescription || body.excerpt?.substring(0, 160);

    const existing = await Blog.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const newBlog = await Blog.create({
      title: body.title,
      slug: slug,
      excerpt: body.excerpt,
      content: body.content,
      coverImage: body.coverImage || "",
      author: body.author,
      category: body.category || "Career Guide",
      tags: body.tags || [],
      metaTitle,
      metaDescription,
      metaKeywords: body.metaKeywords || body.tags || [],
      ogImage: body.ogImage || body.coverImage || "",
      status: "published"
    });

    return NextResponse.json({ success: true, blog: newBlog }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}