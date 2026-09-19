import mongoose, { Schema, Document } from "mongoose";

export interface IProfile extends Document {
  user: mongoose.Types.ObjectId;
  firstName?: string;
  lastName?: string;
  headline?: string;
  bio?: string;
  phone?: string;
  location?: string;
  skills: string[];
  profileImage?: string;
  resumeUrl?: string;
  resumeName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // 1 user = 1 profile
      index: true,
    },
    firstName: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    headline: {
      type: String,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    profileImage: {
      type: String,
      default: "",
    },
    resumeUrl: {
      type: String,
      default: "",
    },
    resumeName: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// fast lookup by user
ProfileSchema.index({ user: 1 });

export default mongoose.models.Profile || mongoose.model<IProfile>("Profile", ProfileSchema);