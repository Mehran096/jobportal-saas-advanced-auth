export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

// keep models registered
import "@/models/Job";
import "@/models/User";
import "@/models/Profile";
import Application from "@/models/Application";
import Job from "@/models/Job";
import User from "@/models/User";
import Profile from "@/models/Profile";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const userToken = await verifyToken(req);

    if (userToken.role !== "jobseeker") {
      return NextResponse.json({ message: "Only jobseekers can apply" }, { status: 403 });
    }

    const body = await req.json();
    const { job } = body as { job?: string };

    if (!job || !mongoose.Types.ObjectId.isValid(job)) {
      return NextResponse.json({ message: "Valid Job ID is required" }, { status: 400 });
    }

    // Get user, profile, and job in parallel
    const [user, profile, jobDoc] = await Promise.all([
      User.findById(userToken.id),
      Profile.findOne({ user: userToken.id }),
      Job.findById(job).lean(),
    ]);

    if (!user || !jobDoc) {
      return NextResponse.json({ message: "User or Job not found" }, { status: 404 });
    }

    if (!profile || !profile.resumeUrl) {
      return NextResponse.json({ message: "Please upload your CV in Profile first" }, { status: 400 });
    }

    const application = await Application.create({
      job: jobDoc._id,
      applicant: user._id,
      employer: jobDoc.postedBy,
      resumeUrl: profile.resumeUrl,
      snapshot: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        headline: profile.headline,
        bio: profile.bio,
        phone: profile.phone,
        location: profile.location,
        profileImage: profile.profileImage,
        resumeUrl: profile.resumeUrl,
        resumeName: profile.resumeName,
        skills: profile.skills,
        email: user.email,
      },
    });

    return NextResponse.json({ message: "Applied successfully", application }, { status: 201 });

  } catch (error: unknown) {
    // duplicate key = already applied
    if (error instanceof Error) {
      const mongoError = error as Error & { code?: number };
      if (mongoError.code === 11000) {
        return NextResponse.json({ message: "You already applied to this job" }, { status: 400 });
      }
      console.error("APPLY ERROR:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}