import { getToken, JWT } from "next-auth/jwt"
import { NextRequest } from "next/server"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { AuthOptions, User as NextAuthUser } from "next-auth"
import dbConnect from "./db"
import User from "@/models/User"
import bcrypt from "bcryptjs"

type UserRole = "jobseeker" | "employer" | "admin"
type Provider = "credentials" | "google" | "both"

interface AppUser extends NextAuthUser {
  id: string
  email: string
  name: string
  firstName: string
  lastName: string
  role: UserRole
  provider: Provider
  image?: string | null
}

interface ExtendedToken extends JWT {
  id?: string
  role?: UserRole
  provider?: Provider
  email?: string
  name?: string
  firstName?: string
  lastName?: string
}

interface SessionUpdatePayload {
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  provider?: Provider
}

interface ExtendedSessionUser {
  id: string
  role: UserRole
  provider: Provider
  email: string
  name: string
  firstName: string
  lastName: string
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
        if (!credentials?.email ||!credentials?.password) {
          throw new Error("Invalid credentials")
        }
        await dbConnect()
        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() }).select("+password")
        if (!user) throw new Error("Invalid credentials")
        if (user.provider === "google" &&!user.password) throw new Error("GOOGLE_ONLY")
        if (!user.password) throw new Error("Invalid credentials")
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) throw new Error("Invalid credentials")

        const appUser: AppUser = {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as UserRole,
          provider: user.provider as Provider,
          image: user.image,
        }
        return appUser
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  callbacks: {
    async signIn({ user, account }) {
  if (account?.provider === "google") {
    await dbConnect()
    const emailLower = user.email?.toLowerCase()
    if (!emailLower) return false
    const existing = await User.findOne({ email: emailLower })

    if (!existing) {
      const fullName = user.name || "User"
      const parts = fullName.trim().split(" ")
      const firstName = parts[0] || "User"
      const lastName = parts.slice(1).join(" ") || "User"
      const newUser = await User.create({
        firstName,
        lastName,
        email: emailLower,
        image: user.image?? undefined,
        provider: "google",
        role: "jobseeker",
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
      // FIX: removed && existing.password -> was blocking because password select:false
      if (existing.provider === "credentials") {
        existing.provider = "both"
        if (!existing.image && user.image) existing.image = user.image
        await existing.save()
        console.log("✅ LINKED credentials -> both for", emailLower)
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
    }
  }
  return true
},
    async jwt({ token, user, trigger, session }) {
      const extToken = token as unknown as ExtendedToken

      if (user) {
        const appUser = user as unknown as AppUser
        extToken.id = appUser.id
        extToken.role = appUser.role
        extToken.provider = appUser.provider
        extToken.email = appUser.email
        extToken.firstName = appUser.firstName
        extToken.lastName = appUser.lastName
        extToken.name = `${appUser.firstName} ${appUser.lastName}`.trim()
        return extToken
      }

      if (trigger === "update") {
        const payload = session as unknown as SessionUpdatePayload
        if (payload.firstName) extToken.firstName = payload.firstName
        if (payload.lastName) extToken.lastName = payload.lastName
        if (payload.name) {
          const parts = payload.name.trim().split(" ")
          extToken.firstName = parts[0]
          extToken.lastName = parts.slice(1).join(" ") || extToken.lastName
        }
        if (extToken.firstName && extToken.lastName) {
          extToken.name = `${extToken.firstName} ${extToken.lastName}`.trim()
        }
        if (payload.email) extToken.email = payload.email
        if (payload.provider) extToken.provider = payload.provider
        return extToken
      }

      // FIXED: Always refresh from DB (removed &&!user)
      if (extToken.email) {
        try {
          await dbConnect()
          const dbUser = await User.findOne({ email: (extToken.email as string).toLowerCase() })
          if (dbUser) {
            extToken.id = dbUser._id.toString()
            extToken.role = dbUser.role as UserRole
            extToken.provider = dbUser.provider as Provider
            extToken.firstName = dbUser.firstName
            extToken.lastName = dbUser.lastName
            extToken.name = dbUser.name
            extToken.email = dbUser.email
          }
        } catch (err) {
          console.error("jwt callback error:", err)
        }
      }
      return extToken
    },
    async session({ session, token }) {
      const extToken = token as unknown as ExtendedToken
      if (session.user && extToken.id) {
        const sessionUser = session.user as unknown as ExtendedSessionUser
        sessionUser.id = extToken.id
        sessionUser.role = extToken.role as UserRole
        sessionUser.provider = extToken.provider as Provider
        sessionUser.email = extToken.email as string
        sessionUser.name = extToken.name as string
        sessionUser.firstName = extToken.firstName as string
        sessionUser.lastName = extToken.lastName as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export async function verifyToken(req: NextRequest) {
  const token = (await getToken({ req, secret: process.env.NEXTAUTH_SECRET })) as ExtendedToken | null
  if (!token?.id) throw new Error("No token provided")
  return { id: token.id, role: token.role as UserRole, email: token.email }
}

export async function getCurrentUser() {
  const { getServerSession } = await import("next-auth/next")
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("Unauthorized")
  const sessionUser = session.user as unknown as ExtendedSessionUser
  return {
    id: sessionUser.id,
    role: sessionUser.role,
    provider: sessionUser.provider,
    email: sessionUser.email,
    name: sessionUser.name,
    firstName: sessionUser.firstName,
    lastName: sessionUser.lastName,
  }
}