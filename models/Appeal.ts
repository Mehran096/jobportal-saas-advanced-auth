import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAppeal extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
}

const AppealSchema: Schema<IAppeal> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, required: true, lowercase: true },
    message: { type: String, required: true, maxlength: 1000 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    adminNote: { type: String, default: "" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// One pending appeal per user at a time
AppealSchema.index({ userId: 1, status: 1 });

const Appeal: Model<IAppeal> = mongoose.models.Appeal || mongoose.model<IAppeal>("Appeal", AppealSchema);
export default Appeal;