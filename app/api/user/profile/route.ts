import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { UTApi } from "uploadthing/server";

// Helper to get fileKey from ufsUrl
function getFileKeyFromUrl(url: string) {
  if (!url) return "";
  try {
    // url like https://s7cs7dje8i.ufs.sh/f/abc123...
    return url.split("/f/")[1]?.split("/")[0] || "";
  } catch {
    return "";
  }
}

const utapi = new UTApi();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const email = (session.user as any).email;
  const user = await User.findOne({ email });
  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const email = (session.user as any).email;

  const existing = await User.findOne({ email });

  if (existing) {
    // If profileImage changed -> delete old one from UploadThing
    if (body.profileImage && existing.profileImage && body.profileImage!== existing.profileImage) {
      const oldKey = getFileKeyFromUrl(existing.profileImage);
      if (oldKey) {
        try { await utapi.deleteFiles(oldKey); } catch (e) { console.log("Failed to delete old image", e); }
      }
    }

    // If resume changed -> delete old one from UploadThing
    if (body.resumeUrl && existing.resumeUrl && body.resumeUrl!== existing.resumeUrl) {
      const oldKey = getFileKeyFromUrl(existing.resumeUrl);
      if (oldKey) {
        try { await utapi.deleteFiles(oldKey); } catch (e) { console.log("Failed to delete old resume", e); }
      }
    }
  }

  const updated = await User.findOneAndUpdate({ email }, body, { new: true });
  return NextResponse.json(updated);
}