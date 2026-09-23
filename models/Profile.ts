import mongoose, { Schema, Document } from "mongoose";

export interface IProfile extends Document {
  user: mongoose.Types.ObjectId;
  // common
  phone?: string;
  location?: string;
  profileImage?: string;
  // jobseeker
  firstName?: string;
  lastName?: string;
  headline?: string;
  bio?: string;
  skills: string[];
  resumeUrl?: string;
  resumeName?: string;
  // employer
  companyName?: string;
  companyWebsite?: string;
  companySize?: string;
  companyDescription?: string;
  companyLogo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    phone: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    profileImage: { type: String, default: "" },

    // jobseeker
    firstName: { type: String, default: "", trim: true },
    lastName: { type: String, default: "", trim: true },
    headline: { type: String, default: "", trim: true },
    bio: { type: String, default: "", maxlength: 500 },
    skills: { type: [String], default: [] },
    resumeUrl: { type: String, default: "" },
    resumeName: { type: String, default: "" },

    // employer
    companyName: { type: String, default: "", trim: true },
    companyWebsite: { type: String, default: "", trim: true },
    companySize: { type: String, default: "", trim: true },
    companyDescription: { type: String, default: "", maxlength: 1000 },
    companyLogo: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Profile || mongoose.model<IProfile>("Profile", ProfileSchema);