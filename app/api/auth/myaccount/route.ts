export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";

import "@/models/Job";
import "@/models/Application";
import "@/models/SavedJob";
import "@/models/Profile";
import "@/models/Notification";

import User from "@/models/User";
import Job from "@/models/Job";
import Application from "@/models/Application";
import SavedJob from "@/models/SavedJob";
import Profile from "@/models/Profile";
import Notification from "@/models/Notification";
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

interface VerifiedUser { id: string; role: string; }
interface UpdateBody { firstName?: string; lastName?: string; email?: string; }
interface ProfileFiles { profileImage?: string; resumeUrl?: string; }
interface MongoDuplicateError { code: number; }

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = (await verifyToken(req)) as VerifiedUser;
    // FIX: lean with virtuals to include name = firstName + lastName
    const dbUser = await User.findById(user.id).select("-password").lean({ virtuals: true });
    if (!dbUser) return NextResponse.json({ message: "User not found" }, { status: 404 });
    return NextResponse.json({ user: dbUser }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const user = (await verifyToken(req)) as VerifiedUser;
    const body = (await req.json()) as UpdateBody;

    const updates: Record<string, string> = {};
    if (body.firstName?.trim()) updates.firstName = body.firstName.trim();
    if (body.lastName?.trim()) updates.lastName = body.lastName.trim();
    if (body.email?.trim()) updates.email = body.email.trim().toLowerCase();

    if (!Object.keys(updates).length) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(user.id, updates, {
      new: true,
      runValidators: true
    }).select("-password").lean({ virtuals: true }); // FIX: virtuals

    if (updated) {
      const profileUpdates: Record<string, string> = {};
      if (updates.firstName) profileUpdates.firstName = updates.firstName;
      if (updates.lastName) profileUpdates.lastName = updates.lastName;
      if (Object.keys(profileUpdates).length > 0) {
        await Profile.findOneAndUpdate(
          { user: user.id },
          profileUpdates,
          { upsert: true, runValidators: true }
        );
      }
    }

    return NextResponse.json({ message: "Account updated", user: updated }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error!== null &&
      "code" in error &&
      (error as MongoDuplicateError).code === 11000
    ) {
      return NextResponse.json({ message: "Email already taken" }, { status: 400 });
    }
    const message = error instanceof Error? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const user = (await verifyToken(req)) as VerifiedUser;

    const profile = await Profile.findOne({ user: user.id }).lean<ProfileFiles>();
    const keys: string[] = [];
    if (profile) {
      if (profile.profileImage) {
        const k = getFileKeyFromUrl(profile.profileImage);
        if (k) keys.push(k);
      }
      if (profile.resumeUrl) {
        const k = getFileKeyFromUrl(profile.resumeUrl);
        if (k) keys.push(k);
      }
    }

    if (user.role === "employer") {
      const myJobs = await Job.find({ postedBy: user.id }).select("_id").lean();
      const jobIds = myJobs.map((j) => j._id);
      await Promise.all([
        Application.deleteMany({ employer: user.id }),
        Application.deleteMany({ job: { $in: jobIds } }),
        Job.deleteMany({ postedBy: user.id }),
        SavedJob.deleteMany({ job: { $in: jobIds } }),
        Notification.deleteMany({ user: user.id }),
        Profile.deleteOne({ user: user.id }),
      ]);
    } else {
      await Promise.all([
        Application.deleteMany({ applicant: user.id }),
        SavedJob.deleteMany({ user: user.id }),
        Notification.deleteMany({ user: user.id }),
        Profile.deleteOne({ user: user.id }),
      ]);
    }

    await User.findByIdAndDelete(user.id);

    if (keys.length > 0) {
      try {
        await utapi.deleteFiles(keys);
      } catch {
        // ignore UT error
      }
    }

    return NextResponse.json({ message: "Account deleted permanently" }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    const message = error instanceof Error? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}