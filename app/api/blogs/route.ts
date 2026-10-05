export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";

type SearchClause = {
  title?: { $regex: string; $options: string };
  excerpt?: { $regex: string; $options: string };
  tags?: { $regex: string; $options: string };
};

type BlogFilter = {
  status?: string;
  category?: string;
  $or?: SearchClause[];
};

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "9")));
    const skip = (page - 1) * limit;

    const filter: BlogFilter = { status: "published" };
    
    if (category && category !== "All") {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate("author", "name email image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      { 
        success: true, 
        blogs,
        pagination: { total, totalPages, currentPage: page, hasNext: page < totalPages, hasPrev: page > 1 }
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST - same as yours
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json() as {
      title: string; excerpt: string; content: string; slug?: string;
      coverImage?: string; author: string; category?: string;
      tags?: string[]; metaTitle?: string; metaDescription?: string;
      metaKeywords?: string[]; ogImage?: string;
    };

    let slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString().slice(-4);
    const existing = await Blog.findOne({ slug });
    if (existing) slug = `${slug}-${Math.floor(Math.random() * 1000)}`;

    const newBlog = await Blog.create({
      title: body.title,
      slug,
      excerpt: body.excerpt,
      content: body.content,
      coverImage: body.coverImage || "",
      author: body.author,
      category: body.category || "Career Guide",
      tags: body.tags || [],
      metaTitle: body.metaTitle || body.title?.substring(0, 60),
      metaDescription: body.metaDescription || body.excerpt?.substring(0, 160),
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