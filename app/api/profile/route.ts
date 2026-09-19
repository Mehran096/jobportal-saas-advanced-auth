import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Profile from "@/models/Profile";
import { UTApi } from "uploadthing/server";

function getFileKeyFromUrl(url: string): string {
  if (!url) return "";
  try {
    const afterF = url.split("/f/")[1];
    if (!afterF) return url.split("/").pop()?.split("?")[0] || "";
    return afterF.split("/")[0].split("?")[0];
  } catch {
    return "";
  }
}

const utapi = new UTApi();

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  let profile = await Profile.findOne({ user: user._id });

  if (!profile) {
    profile = await Profile.create({
      user: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      headline: "",
      bio: "",
      phone: "",
      location: "",
      skills: [],
      profileImage: "",
      resumeUrl: "",
      resumeName: "",
    });
  }

  return NextResponse.json({
   ...profile.toObject(),
    email: user.email,
    role: user.role,
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    resumeUrl?: string;
    headline?: string;
    bio?: string;
    phone?: string;
    location?: string;
    skills?: string[];
    resumeName?: string;
  };

  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const existing = await Profile.findOne({ user: user._id });

  if (existing) {
    if (body.profileImage && existing.profileImage && body.profileImage!== existing.profileImage) {
      const oldKey = getFileKeyFromUrl(existing.profileImage);
      if (oldKey) {
        try { await utapi.deleteFiles(oldKey); } catch (e) { console.log("Failed to delete old image", e); }
      }
    }
    if (body.profileImage === "" && existing.profileImage) {
      const oldKey = getFileKeyFromUrl(existing.profileImage);
      if (oldKey) {
        try { await utapi.deleteFiles(oldKey); } catch (e) { console.log("Failed to delete on user delete", e); }
      }
    }
    if (body.resumeUrl && existing.resumeUrl && body.resumeUrl!== existing.resumeUrl) {
      const oldKey = getFileKeyFromUrl(existing.resumeUrl);
      if (oldKey) {
        try { await utapi.deleteFiles(oldKey); } catch (e) { console.log("Failed to delete old resume", e); }
      }
    }
    if (body.resumeUrl === "" && existing.resumeUrl) {
      const oldKey = getFileKeyFromUrl(existing.resumeUrl);
      if (oldKey) {
        try { await utapi.deleteFiles(oldKey); } catch (e) { console.log("Failed to delete resume on delete", e); }
      }
    }
  }

  if (body.firstName || body.lastName) {
    await User.findByIdAndUpdate(user._id, {
      firstName: body.firstName?? user.firstName,
      lastName: body.lastName?? user.lastName,
    });
  }

  const updatedProfile = await Profile.findOneAndUpdate(
    { user: user._id },
    {...body, user: user._id },
    { new: true, upsert: true }
  );

  return NextResponse.json({
   ...updatedProfile.toObject(),
    email: user.email,
    role: user.role,
  });
}

// ===== NEW: CLEAR PROFILE ONLY (keep User) =====
export async function DELETE() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const profile = await Profile.findOne({ user: user._id });
  if (!profile) {
    return NextResponse.json({ success: true, message: "Already empty" });
  }

  // 1. Delete files from UploadThing
  const keys: string[] = [];
  if (profile.profileImage) {
    const k = getFileKeyFromUrl(profile.profileImage);
    if (k) keys.push(k);
  }
  if (profile.resumeUrl) {
    const k = getFileKeyFromUrl(profile.resumeUrl);
    if (k) keys.push(k);
  }
  if (keys.length) {
    try { await utapi.deleteFiles(keys); console.log("Deleted on clear:", keys); } catch (e) { console.log("UT delete failed", e); }
  }

  // 2. Clear fields - works now because required: false
  const cleared = await Profile.findOneAndUpdate(
    { user: user._id },
    {
      firstName: "",
      lastName: "",
      headline: "",
      bio: "",
      phone: "",
      location: "",
      skills: [],
      profileImage: "",
      resumeUrl: "",
      resumeName: "",
    },
    { new: true }
  );

  return NextResponse.json({
    success: true,
    message: "Profile cleared, user kept",
    profile: cleared,
  });
}