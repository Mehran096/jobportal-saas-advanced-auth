import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Application from "@/models/Application";
import { verifyToken } from "@/lib/auth";
import { sendStatusEmail } from "@/lib/mailer";
import Notification from "@/models/Notification";
import { Types } from "mongoose";

type Params = { params: Promise<{ id: string }> };

interface PopulatedJob {
  _id: Types.ObjectId;
  title: string;
  postedBy: Types.ObjectId;
}

interface PopulatedApplicant {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
}

interface Snapshot {
  firstName?: string;
  lastName?: string;
  email?: string;
}

type ValidStatus = "pending" | "shortlisted" | "accepted" | "rejected";
const FINAL_STATUSES: ValidStatus[] = ["accepted", "rejected", "shortlisted"];
const VALID_STATUSES: ValidStatus[] = ["pending", "shortlisted", "accepted", "rejected"];

// --- NEW: GET FOR YOUR FULL DETAILS PAGE ---
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;
    const user = await verifyToken(req) as unknown as { id: string; role: string };

    if (user.role !== "employer") {
      return NextResponse.json({ message: "Only employers can view" }, { status: 403 });
    }

    type LeanApplication = {
      _id: Types.ObjectId;
      job: PopulatedJob;
      employer: Types.ObjectId;
      applicant: Types.ObjectId;
      status: ValidStatus;
      snapshot: Snapshot & { email?: string };
    };

    const application = (await Application.findById(id)
      .populate<{ job: PopulatedJob }>("job", "title company location type postedBy")
      .lean()) as unknown as LeanApplication | null;

    if (!application) {
      return NextResponse.json({ message: "Application not found" }, { status: 404 });
    }

    const job = application.job as unknown as PopulatedJob;

    if (!job || !job.postedBy) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    if (job.postedBy.toString() !== user.id) {
      return NextResponse.json({ message: "Forbidden: Not your job" }, { status: 403 });
    }

    return NextResponse.json({ application, job }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

// --- YOUR PATCH (UPGRADED WITH SHORTLIST EMAIL) ---
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = (await req.json()) as { status?: ValidStatus };
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    let user: { id: string; role: string };
    try {
      user = await verifyToken(req) as { id: string; role: string };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      return NextResponse.json({ message }, { status: 401 });
    }

    if (user.role !== "employer") {
      return NextResponse.json({ message: "Only employers can update status" }, { status: 403 });
    }

    const application = await Application.findById(id)
      .populate<{ job: PopulatedJob }>("job", "title postedBy")
      .populate<{ applicant: PopulatedApplicant }>("applicant", "firstName lastName email");

    if (!application) {
      return NextResponse.json({ message: "Application not found" }, { status: 404 });
    }

    const job = application.job as unknown as PopulatedJob;
    if (!job || job.postedBy.toString() !== user.id) {
      return NextResponse.json({ message: "Forbidden: Not your job" }, { status: 403 });
    }

    if (FINAL_STATUSES.includes(application.status as ValidStatus)) {
      return NextResponse.json(
        { message: `Already ${application.status}. Cannot change status again.` },
        { status: 400 }
      );
    }

    if (application.status === status) {
      return NextResponse.json({ message: `Already ${status}` }, { status: 400 });
    }

    application.status = status;
    await application.save();

    // SEND EMAIL + NOTIFICATION FOR FINAL STATUSES (now includes shortlisted!)
    if (FINAL_STATUSES.includes(status)) {
      const applicant = application.applicant as unknown as PopulatedApplicant | null;
      const snapshot = (application as unknown as { snapshot?: Snapshot }).snapshot ?? {};

      const fullName = applicant
        ? `${applicant.firstName} ${applicant.lastName}`
        : `${snapshot.firstName ?? ""} ${snapshot.lastName ?? ""}`.trim() || "Candidate";

      const email = applicant?.email ?? snapshot.email;

      if (email) {
        try {
          await sendStatusEmail(email, fullName, job.title, status);
        } catch (mailErr: unknown) {
          console.error("Email failed:", mailErr);
        }
      }

      const applicantId = applicant?._id ?? (application as unknown as { applicant: Types.ObjectId }).applicant;
      if (applicantId) {
        await Notification.create({
          user: applicantId,
          message: `Your application for "${job.title}" was ${status}`,
          link: `/dashboard/applications`,
        });
      }
    }

    return NextResponse.json({ message: "Status updated", application }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("Update Application Status Error:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}