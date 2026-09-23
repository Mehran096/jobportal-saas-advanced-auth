export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import Profile from "@/models/Profile";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

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

interface VerifiedUser {
  id: string;
  role: string;
}

interface UserLean {
  _id: unknown;
  firstName: string;
  lastName: string;
  email: string;
  role: "jobseeker" | "employer" | "admin";
}

interface ProfileBody {
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
  // employer
  companyName?: string;
  companyWebsite?: string;
  companySize?: string;
  companyDescription?: string;
  companyLogo?: string;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const auth = (await verifyToken(req)) as VerifiedUser;
    const dbUser = await User.findById(auth.id).lean<UserLean>();
    if (!dbUser) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let profile = await Profile.findOne({ user: auth.id });
    if (!profile) {
      profile = await Profile.create({
        user: auth.id,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        headline: "",
        bio: "",
        phone: "",
        location: "",
        skills: [],
        profileImage: "",
        resumeUrl: "",
        resumeName: "",
        companyName: "",
        companyWebsite: "",
        companySize: "",
        companyDescription: "",
        companyLogo: "",
      });
    }

    return NextResponse.json({
     ...profile.toObject(),
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      email: dbUser.email,
      role: dbUser.role,
    });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const auth = (await verifyToken(req)) as VerifiedUser;
    const body = (await req.json()) as ProfileBody;

    const dbUser = await User.findById(auth.id);
    if (!dbUser) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const existing = await Profile.findOne({ user: dbUser._id });

    if (existing) {
      // jobseeker images
      if (body.profileImage && existing.profileImage && body.profileImage!== existing.profileImage) {
        const oldKey = getFileKeyFromUrl(existing.profileImage);
        if (oldKey) { try { await utapi.deleteFiles(oldKey); } catch { /* ignore */ } }
      }
      if (body.profileImage === "" && existing.profileImage) {
        const oldKey = getFileKeyFromUrl(existing.profileImage);
        if (oldKey) { try { await utapi.deleteFiles(oldKey); } catch { /* ignore */ } }
      }
      if (body.resumeUrl && existing.resumeUrl && body.resumeUrl!== existing.resumeUrl) {
        const oldKey = getFileKeyFromUrl(existing.resumeUrl);
        if (oldKey) { try { await utapi.deleteFiles(oldKey); } catch { /* ignore */ } }
      }
      if (body.resumeUrl === "" && existing.resumeUrl) {
        const oldKey = getFileKeyFromUrl(existing.resumeUrl);
        if (oldKey) { try { await utapi.deleteFiles(oldKey); } catch { /* ignore */ } }
      }
      // employer logo
      if (body.companyLogo && existing.companyLogo && body.companyLogo!== existing.companyLogo) {
        const oldKey = getFileKeyFromUrl(existing.companyLogo);
        if (oldKey) { try { await utapi.deleteFiles(oldKey); } catch { /* ignore */ } }
      }
      if (body.companyLogo === "" && existing.companyLogo) {
        const oldKey = getFileKeyFromUrl(existing.companyLogo);
        if (oldKey) { try { await utapi.deleteFiles(oldKey); } catch { /* ignore */ } }
      }
    }

    const userDoc = dbUser as unknown as UserLean;
    if (body.firstName || body.lastName) {
      await User.findByIdAndUpdate(dbUser._id, {
        firstName: body.firstName?? userDoc.firstName,
        lastName: body.lastName?? userDoc.lastName,
      });
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      { user: dbUser._id },
      {...body, user: dbUser._id },
      { new: true, upsert: true }
    );

    const freshUser = await User.findById(dbUser._id).lean<UserLean>();
    return NextResponse.json({
     ...updatedProfile.toObject(),
      email: freshUser?.email,
      role: freshUser?.role,
    });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const auth = (await verifyToken(req)) as VerifiedUser;
    const dbUser = await User.findById(auth.id).lean<UserLean>();
    if (!dbUser) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const profile = await Profile.findOne({ user: auth.id });
    if (!profile) return NextResponse.json({ success: true, message: "Already empty" });

    const keys: string[] = [];
    if (profile.profileImage) {
      const k = getFileKeyFromUrl(profile.profileImage);
      if (k) keys.push(k);
    }
    if (profile.resumeUrl) {
      const k = getFileKeyFromUrl(profile.resumeUrl);
      if (k) keys.push(k);
    }
    if (profile.companyLogo) {
      const k = getFileKeyFromUrl(profile.companyLogo);
      if (k) keys.push(k);
    }
    if (keys.length) {
      try { await utapi.deleteFiles(keys); } catch { /* ignore */ }
    }

    const cleared = await Profile.findOneAndUpdate(
      { user: auth.id },
      {
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        headline: "",
        bio: "",
        phone: "",
        location: "",
        skills: [],
        profileImage: "",
        resumeUrl: "",
        resumeName: "",
        companyName: "",
        companyWebsite: "",
        companySize: "",
        companyDescription: "",
        companyLogo: "",
      },
      { new: true }
    );

    return NextResponse.json({ success: true, message: "Profile cleared", profile: cleared });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}