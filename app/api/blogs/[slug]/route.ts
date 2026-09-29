export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import "@/models/User";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { slug } = await params; // <-- Yahi main fix hai

    const blog = await Blog.findOne({ slug });

    if (!blog) {
      return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
    }

    await Blog.updateOne({ slug }, { $inc: { views: 1 } }).catch(() => {});

    return NextResponse.json({ success: true, blog });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { slug: oldSlug } = await params; // <-- await
    const body = await req.json() as {
      title?: string;
      excerpt?: string;
      content?: string;
      category?: string;
      tags?: string[];
      coverImage?: string;
    };

    const updateData: Record<string, unknown> = {
      ...body,
      updatedAt: new Date(),
    };

    if (body.title) {
      const newSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      updateData.slug = newSlug;
      updateData.metaTitle = body.title.substring(0, 60);
    }
    if (body.excerpt) {
      updateData.metaDescription = body.excerpt.substring(0, 160);
    }

    const updated = await Blog.findOneAndUpdate(
      { slug: oldSlug },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, blog: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { slug } = await params; // <-- await

    const deleted = await Blog.findOneAndDelete({ slug });

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}