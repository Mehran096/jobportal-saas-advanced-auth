import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { getCurrentUser } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const me = await getCurrentUser()
    const { newPassword } = await req.json() as { newPassword?: string }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ message: "Min 6 characters" }, { status: 400 })
    }

    const user = await User.findById(me.id).select("+password")
    if (!user) return NextResponse.json({ message: "Not found" }, { status: 404 })
    
    if (user.password) {
      return NextResponse.json({ message: "Already have password. Use Change Password" }, { status: 400 })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    user.provider = "both"
    await user.save()

    return NextResponse.json({ 
      message: "Password set! Now you can login with Google + Password",
      provider: "both" 
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error"
    // FIX: Return 401 for Unauthorized, not 500
    const status = message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ message }, { status })
  }
}