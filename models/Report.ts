import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReport extends Document {
  reportedUser: mongoose.Types.ObjectId; // the user being reported
  reportedBy: mongoose.Types.ObjectId;   // who reported
  reason: "spam" | "fake_job" | "abuse" | "scam" | "inappropriate_content" | "other";
  details?: string; // optional description from reporter
  jobId?: mongoose.Types.ObjectId | null; // if reporting a specific job
  status: "pending" | "reviewed" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema<IReport> = new Schema(
  {
    reportedUser: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    reportedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true
    },
    reason: { 
      type: String, 
      enum: ["spam", "fake_job", "abuse", "scam", "inappropriate_content", "other"],
      required: true,
      index: true
    },
    details: { 
      type: String, 
      maxlength: 500,
      trim: true,
      default: "" 
    },
    jobId: { 
      type: Schema.Types.ObjectId, 
      ref: "Job",
      default: null
    },
    status: { 
      type: String, 
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
      index: true
    },
  },
  { timestamps: true }
);

// Prevent same user reporting same user for same reason within 24h spam
ReportSchema.index({ reportedUser: 1, reportedBy: 1, reason: 1 });
ReportSchema.index({ createdAt: -1 });

const Report: Model<IReport> = mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);
export default Report;