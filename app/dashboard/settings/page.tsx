"use client"
export const dynamic = 'force-dynamic';

import { useSession, signIn } from "next-auth/react"
import toast from "react-hot-toast"
import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useChangePasswordMutation, useSetPasswordMutation, useGetMyAccountQuery } from "@/lib/redux/api/authApi"
import DashboardHeader from "@/app/components/DashboardHeader"
import DashboardMobileNav from "@/app/components/DashboardMobileNav";

type Provider = "credentials" | "google" | "both"
interface ExtendedUser { provider?: Provider }

function Skeleton() {
  return (
    <>
      <DashboardHeader />
      <div className="max-w-2xl mx-auto p-3 sm:p-6 space-y-4 animate-pulse pb-20">
        <div className="h-6 w-24 bg-gray-200 rounded-lg"></div>
        <div className="bg-white border rounded-2xl p-4 space-y-3">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
          <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    </>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { data } = useSession()
  const sessionProvider = (data?.user as ExtendedUser | undefined)?.provider

  const { data: accountData, isLoading: accountLoading, refetch } = useGetMyAccountQuery()
  const dbProvider = accountData?.user?.provider as Provider | undefined
  const provider: Provider | undefined = dbProvider || sessionProvider

  const [curr, setCurr] = useState("")
  const [next, setNext] = useState("")
  const [newForGoogle, setNewForGoogle] = useState("")

  const [changePassword, { isLoading: changing }] = useChangePasswordMutation()
  const [setPassword, { isLoading: setting }] = useSetPasswordMutation()

  const onChangePass = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const res = await changePassword({ currentPassword: curr, newPassword: next }).unwrap()
      toast.success(res.message)
      setCurr(""); setNext("")
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error.data?.message || "Failed")
    }
  }

  const onSetPass = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const res = await setPassword({ newPassword: newForGoogle }).unwrap()
      toast.success(res.message)
      setNewForGoogle("")
      await refetch()
      router.refresh()
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error.data?.message || "Failed")
    }
  }

  if (accountLoading) return <Skeleton />

  const isGoogle = provider === "google"
  const isBoth = provider === "both"
  const isCredentials = provider === "credentials"

  return (
    <>
      <DashboardHeader />
      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-3 sm:py-6 pb-24 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-[16px] sm:text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-[11px] sm:text-xs text-zinc-500 mt-1">Manage login and security</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 sm:p-5 space-y-3 shadow-sm">
          <h2 className="font-semibold text-[13px] sm:text-[14px]">Login Methods</h2>

          <div className="flex justify-between items-center border border-zinc-200 p-3 rounded-xl text-[12px] sm:text-[13px]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
              Password: <span className="font-medium">{isCredentials || isBoth? "Enabled" : "Not set"}</span>
            </span>
            <span className="text-[11px]">{isCredentials || isBoth? "✅" : "❌"}</span>
          </div>

          <div className="flex justify-between items-center border border-zinc-200 p-3 rounded-xl text-[12px] sm:text-[13px]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Google: <span className="font-medium">{isGoogle || isBoth? "Linked" : "Not linked"}</span>
            </span>
            {isCredentials? (
              <button
                onClick={() => signIn("google", { callbackUrl: "/dashboard/settings" })}
                className="border border-zinc-300 px-3 py-1.5 rounded-full text-[11px] font-medium hover:bg-zinc-50 active:scale-[0.98] transition"
              >
                Link Google
              </button>
            ) : (
              <span className="text-[11px]">{isGoogle || isBoth? "✅" : "❌"}</span>
            )}
          </div>

          {isBoth && <p className="text-[11px] text-green-700 bg-green-50 border border-green-200 p-2.5 rounded-xl">✅ Both methods enabled - you can login with either</p>}
          {!provider && <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">Loading provider...</p>}
        </div>

        {(isCredentials || isBoth) && (
          <form onSubmit={onChangePass} className="bg-white border border-zinc-200 rounded-2xl p-3.5 sm:p-5 space-y-3 shadow-sm">
            <h2 className="font-semibold text-[13px] sm:text-[14px]">Change Password</h2>
            <div className="space-y-2">
              <input type="password" placeholder="Current password" value={curr} onChange={e=>setCurr(e.target.value)} className="w-full border border-zinc-300 px-3.5 py-3 sm:py-2.5 rounded-xl text-[16px] sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-black" required />
              <input type="password" placeholder="New password" value={next} onChange={e=>setNext(e.target.value)} className="w-full border border-zinc-300 px-3.5 py-3 sm:py-2.5 rounded-xl text-[16px] sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-black" required />
            </div>
            <button disabled={changing} className="bg-black text-white h-11 px-4 rounded-xl text-[13px] font-semibold w-full disabled:opacity-50 active:scale-[0.98] transition">
              {changing? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        {isGoogle && (
          <form onSubmit={onSetPass} className="bg-white border border-zinc-200 rounded-2xl p-3.5 sm:p-5 space-y-3 shadow-sm">
            <h2 className="font-semibold text-[13px] sm:text-[14px]">Set Password</h2>
            <p className="text-[11px] sm:text-xs text-zinc-500">Add a password to enable both login methods</p>
            <input type="password" placeholder="New password" value={newForGoogle} onChange={e=>setNewForGoogle(e.target.value)} className="w-full border border-zinc-300 px-3.5 py-3 sm:py-2.5 rounded-xl text-[16px] sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-black" required />
            <button disabled={setting} className="bg-black text-white h-11 px-4 rounded-xl text-[13px] font-semibold w-full disabled:opacity-50 active:scale-[0.98] transition">
              {setting? "Saving..." : "Set Password"}
            </button>
          </form>
        )}
      </div>
      <DashboardMobileNav />
    </>
  )
}