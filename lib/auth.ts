import { getToken, JWT } from "next-auth/jwt"
import { NextRequest } from "next/server"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { AuthOptions } from "next-auth"
import dbConnect from "./db"
import User from "@/models/User"
import bcrypt from "bcryptjs"

type UserRole = "jobseeker" | "employer" | "admin"

interface AppUser {
  id: string
  email: string
  name: string
  role: UserRole
}

interface ExtendedToken extends JWT {
  id?: string
  role?: UserRole
  email?: string
  name?: string
}

interface ExtendedSessionUser {
  id: string
  role: UserRole
  email: string
  name?: string
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
        if (!credentials?.email ||!credentials?.password) return null
        await dbConnect()
        const user = await User.findOne({ email: credentials.email.toLowerCase() }).select("+password")
        if (!user ||!user.password) return null
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || `${user.firstName} ${user.lastName}`,
          role: user.role as UserRole,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await dbConnect()
        const emailLower = user.email?.toLowerCase()
        const existing = await User.findOne({ email: emailLower })

        if (!existing) {
          const fullName = user.name || "User"
          const parts = fullName.trim().split(" ")
          const firstName = parts[0]
          const lastName = parts.slice(1).join(" ") || "User"

          await User.create({
            firstName,
            lastName,
            name: fullName,
            email: emailLower,
            image: user.image,
            provider: "google",
            role: "jobseeker",
          })
        } else {
          // Attach existing user data to next-auth user for jwt callback 
           
          user.id = existing._id.toString()
          // @ts-expect-error - custom prop
          user.role = existing.role
        }
      }
      return true
    },
    async jwt({ token, user }) {
      const extToken = token as ExtendedToken

      if (user) {
        const appUser = user as unknown as AppUser
        extToken.id = appUser.id || extToken.id
        extToken.role = appUser.role
        extToken.email = appUser.email
        extToken.name = appUser.name
      } else if (extToken.email) {
        try {
          await dbConnect()
          const dbUser = await User.findOne({ email: (extToken.email as string).toLowerCase() })
          if (dbUser) {
            extToken.id = dbUser._id.toString()
            extToken.role = dbUser.role as UserRole
            extToken.name = dbUser.name || `${dbUser.firstName} ${dbUser.lastName}`
            extToken.email = dbUser.email
          }
        } catch (err) {
          console.error("jwt callback error:", err)
        }
      }
      return extToken
    },
    async session({ session, token }) {
      const extendedToken = token as ExtendedToken
      if (session.user && extendedToken.id) {
        const sessionUser = session.user as unknown as ExtendedSessionUser
        sessionUser.id = extendedToken.id
        sessionUser.role = extendedToken.role as UserRole
        sessionUser.email = extendedToken.email as string
        sessionUser.name = extendedToken.name
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export async function verifyToken(req: NextRequest) {
  const token = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as ExtendedToken | null

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
    email: sessionUser.email,
    name: sessionUser.name,
  }
}