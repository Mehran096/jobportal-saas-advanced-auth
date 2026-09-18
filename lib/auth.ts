import { getToken } from "next-auth/jwt"
import { NextRequest } from "next/server"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { AuthOptions } from "next-auth"
import { cookies } from "next/headers"
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

interface ExtendedToken {
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
          name: user.name,
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
        const existing = await User.findOne({ email: user.email?.toLowerCase() })
        if (!existing) {
          const fullName = user.name || "User"
          const parts = fullName.trim().split(" ")
          const firstName = parts[0]
          const lastName = parts.slice(1).join(" ") || "Google"

          // READ ROLE FROM COOKIE
          const cookieStore = await cookies()
          const roleFromCookie = (cookieStore.get("register_role")?.value as UserRole) || "jobseeker"

          await User.create({
            firstName,
            lastName,
            email: user.email?.toLowerCase(),
            image: user.image,
            provider: "google",
            role: roleFromCookie, // <-- NOW DYNAMIC
          })
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        const appUser = user as unknown as AppUser
        token.id = appUser.id
        token.role = appUser.role
        token.email = appUser.email
        token.name = appUser.name
      } else {
        if (token.email) {
          await dbConnect()
          const dbUser = await User.findOne({ email: token.email })
          if (dbUser) {
            token.id = dbUser._id.toString()
            token.role = dbUser.role
            token.name = dbUser.name
          }
        }
      }
      return token
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
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  }) as ExtendedToken | null
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
    name: sessionUser.name
  }
}