// lib/adminAuth.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { Types } from "mongoose";

type UserRole = "jobseeker" | "employer" | "admin";

interface SessionUser {
  id: string;
  role: UserRole;
  email?: string;
}

interface LeanAdmin {
  _id: Types.ObjectId;
  role: UserRole;
  isBanned?: boolean;
}

export async function verifyAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized: No session");
  }

  const user = session.user as SessionUser;

  if (!user.id) {
    throw new Error("Unauthorized: No user id in session");
  }

  await dbConnect();
  
  const dbUser = await User.findById(user.id)
    .select("role isBanned")
    .lean<LeanAdmin>();

  if (!dbUser) {
    throw new Error("Unauthorized: User not found");
  }

  if (dbUser.isBanned) {
    throw new Error("Unauthorized: Banned");
  }

  if (dbUser.role !== "admin") {
    throw new Error("Unauthorized: Not admin");
  }

  return {
    id: dbUser._id.toString(),
    role: dbUser.role,
  };
}