import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { getCurrentUser } from "@/lib/auth"

//this route is for setting password for users who signed up with password not google login.
export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const me = await getCurrentUser()
    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "All fields required" }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ message: "Min 6 characters" }, { status: 400 })
    }

    const user = await User.findById(me.id).select("+password")
    if (!user?.password) {
      return NextResponse.json({ message: "Set a password first" }, { status: 400 })
    }

    const ok = await bcrypt.compare(currentPassword, user.password)
    if (!ok) return NextResponse.json({ message: "Current password wrong" }, { status: 400 })

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    return NextResponse.json({ message: "Password updated!" })
  } catch (err: unknown) {
  const message = err instanceof Error ? err.message : "Server error"
  return NextResponse.json({ message }, { status: 500 })
}
}