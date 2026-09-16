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

type ValidStatus = "pending" | "reviewed" | "shortlisted" | "accepted" | "rejected";

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = (await req.json()) as { status?: ValidStatus };
    const { status } = body;

    const VALID_STATUSES: ValidStatus[] = ["pending", "reviewed", "shortlisted", "accepted", "rejected"];
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

    application.status = status;
    await application.save();

    if (["accepted", "rejected", "shortlisted"].includes(status)) {
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
          const errMsg = mailErr instanceof Error ? mailErr.message : "Unknown mail error";
          console.error("Email failed:", errMsg);
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