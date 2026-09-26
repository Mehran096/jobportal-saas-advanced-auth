import { getToken, JWT } from "next-auth/jwt"
import { NextRequest } from "next/server"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { AuthOptions, User as NextAuthUser } from "next-auth"
import dbConnect from "./db"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

type UserRole = "jobseeker" | "employer" | "admin"
type Provider = "credentials" | "google" | "both"

interface AppUser extends NextAuthUser {
  id: string; email: string; name: string; firstName: string; lastName: string
  role: UserRole; provider: Provider; image?: string | null; isBanned?: boolean
}
interface ExtendedToken extends JWT {
  id?: string; role?: UserRole; provider?: Provider; email?: string
  name?: string; firstName?: string; lastName?: string; isBanned?: boolean
}
interface SessionUpdatePayload { firstName?: string; lastName?: string; name?: string; email?: string; provider?: Provider }
interface ExtendedSessionUser {
  id: string; role: UserRole; provider: Provider; email: string
  name: string; firstName: string; lastName: string; isBanned?: boolean
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email ||!credentials?.password) throw new Error("Invalid credentials")
        await dbConnect()
        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() }).select("+password")
        if (!user) throw new Error("Invalid credentials")
        if (user.isBanned) throw new Error("BANNED")
        if (user.provider === "google" &&!user.password) throw new Error("GOOGLE_ONLY")
        if (!user.password) throw new Error("Invalid credentials")
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) throw new Error("Invalid credentials")
        const appUser: AppUser = {
          id: user._id.toString(), email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          firstName: user.firstName, lastName: user.lastName,
          role: user.role as UserRole, provider: user.provider as Provider,
          image: user.image, isBanned: user.isBanned,
        }
        return appUser
      },
    }),
  ],
  pages: { signIn: "/login", error: "/auth/error" },
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await dbConnect()
        const emailLower = user.email?.toLowerCase()
        if (!emailLower) return false

        // --- READ ROLE FROM COOKIE ---
        let desiredRole: UserRole = "jobseeker"
        try {
          const cookieStore = await cookies()
          const cookieRole = cookieStore.get("desired_role")?.value
          if (cookieRole === "employer" || cookieRole === "jobseeker") desiredRole = cookieRole
        } catch {}

        const existing = await User.findOne({ email: emailLower })

        if (!existing) {
          const fullName = user.name || "User"
          const parts = fullName.trim().split(" ")
          const firstName = parts[0] || "User"
          const lastName = parts.slice(1).join(" ") || "User"

          const newUser = await User.create({
            firstName, lastName, email: emailLower,
            image: user.image?? undefined,
            provider: "google",
            role: desiredRole, // <-- FIX: not hardcoded anymore
          })
          const typedUser = user as unknown as AppUser
          typedUser.id = newUser._id.toString()
          typedUser.role = newUser.role as UserRole
          typedUser.provider = newUser.provider as Provider
          typedUser.firstName = newUser.firstName
          typedUser.lastName = newUser.lastName
          typedUser.name = `${newUser.firstName} ${newUser.lastName}`.trim()
          typedUser.email = newUser.email
        } else {
          if (existing.isBanned) throw new Error("BANNED")
          if (existing.provider === "credentials") {
            existing.provider = "both"
            if (!existing.image && user.image) existing.image = user.image
            await existing.save()
          }
          if ((existing.provider === "google" || existing.provider === "both") &&!existing.image && user.image) {
            existing.image = user.image
            await existing.save()
          }
          const typedUser = user as unknown as AppUser
          typedUser.id = existing._id.toString()
          typedUser.role = existing.role as UserRole
          typedUser.provider = existing.provider as Provider
          typedUser.firstName = existing.firstName
          typedUser.lastName = existing.lastName
          typedUser.name = `${existing.firstName} ${existing.lastName}`.trim()
          typedUser.email = existing.email
          typedUser.isBanned = existing.isBanned
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      const extToken = token as unknown as ExtendedToken
      if (user) {
        const appUser = user as unknown as AppUser
        extToken.id = appUser.id; extToken.role = appUser.role; extToken.provider = appUser.provider
        extToken.email = appUser.email; extToken.firstName = appUser.firstName; extToken.lastName = appUser.lastName
        extToken.name = `${appUser.firstName} ${appUser.lastName}`.trim(); extToken.isBanned = appUser.isBanned
        return extToken
      }
      if (trigger === "update") {
        const payload = session as unknown as SessionUpdatePayload
        if (payload.firstName) extToken.firstName = payload.firstName
        if (payload.lastName) extToken.lastName = payload.lastName
        if (payload.name) {
          const parts = payload.name.trim().split(" "); extToken.firstName = parts[0]
          extToken.lastName = parts.slice(1).join(" ") || extToken.lastName
        }
        if (extToken.firstName && extToken.lastName) extToken.name = `${extToken.firstName} ${extToken.lastName}`.trim()
        if (payload.email) extToken.email = payload.email
        if (payload.provider) extToken.provider = payload.provider
        return extToken
      }
      if (extToken.email) {
        try {
          await dbConnect()
          const dbUser = await User.findOne({ email: (extToken.email as string).toLowerCase() })
          if (!dbUser) return null as unknown as JWT
          if (dbUser.isBanned) return null as unknown as JWT
          extToken.id = dbUser._id.toString(); extToken.role = dbUser.role as UserRole
          extToken.provider = dbUser.provider as Provider; extToken.firstName = dbUser.firstName
          extToken.lastName = dbUser.lastName; extToken.name = dbUser.name; extToken.email = dbUser.email; extToken.isBanned = dbUser.isBanned
        } catch (err) {
          const msg = err instanceof Error? err.message : "Unknown error"
          console.error("jwt callback error:", msg)
          if (msg === "BANNED") return null as unknown as JWT
        }
      }
      return extToken
    },
    async session({ session, token }) {
      const extToken = token as unknown as ExtendedToken
      if (session.user && extToken.id) {
        const sessionUser = session.user as unknown as ExtendedSessionUser
        sessionUser.id = extToken.id; sessionUser.role = extToken.role as UserRole; sessionUser.provider = extToken.provider as Provider
        sessionUser.email = extToken.email as string; sessionUser.name = extToken.name as string
        sessionUser.firstName = extToken.firstName as string; sessionUser.lastName = extToken.lastName as string; sessionUser.isBanned = extToken.isBanned
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export async function verifyToken(req: NextRequest) {
  const token = (await getToken({ req, secret: process.env.NEXTAUTH_SECRET }) as ExtendedToken | null)
  if (!token?.id) throw new Error("No token provided")
  if (token.isBanned) throw new Error("Account banned")
  return { id: token.id, role: token.role as UserRole, email: token.email }
}
export async function getCurrentUser() {
  const { getServerSession } = await import("next-auth/next")
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("Unauthorized")
  const sessionUser = session.user as unknown as ExtendedSessionUser
  if (sessionUser.isBanned) throw new Error("Account banned")
  return { id: sessionUser.id, role: sessionUser.role, provider: sessionUser.provider, email: sessionUser.email, name: sessionUser.name, firstName: sessionUser.firstName, lastName: sessionUser.lastName }
}