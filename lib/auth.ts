import { getToken } from "next-auth/jwt"
import { NextRequest } from "next/server"
import { getServerSession, AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
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
}

interface ExtendedSessionUser {
  id: string
  role: UserRole
  email: string
  name?: string
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        await dbConnect()
        // FIX 1: +password is required
        const user = await User.findOne({ email: credentials.email }).select("+password")
        if (!user) return null
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
        
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name, // your virtual firstName+lastName
          role: user.role as UserRole,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const appUser = user as unknown as AppUser
        token.id = appUser.id
        token.role = appUser.role
        // FIX 2: keep email in token
        token.email = appUser.email
      }
      return token
    },
    async session({ session, token }) {
      const extendedToken = token as ExtendedToken
      if (session.user && extendedToken.id) {
        const sessionUser = session.user as unknown as ExtendedSessionUser
        sessionUser.id = extendedToken.id as string
        sessionUser.role = extendedToken.role as UserRole
        sessionUser.email = extendedToken.email as string
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

  if (!token?.id) {
    throw new Error("No token provided")
  }

  return { id: token.id, role: token.role as UserRole, email: token.email }
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("Unauthorized")
  const sessionUser = session.user as unknown as ExtendedSessionUser
  return { 
    id: sessionUser.id, 
    role: sessionUser.role, 
    email: sessionUser.email 
  }
}