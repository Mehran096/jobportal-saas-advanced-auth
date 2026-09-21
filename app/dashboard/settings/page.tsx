"use client"
export const dynamic = 'force-dynamic';

import { useSession, signIn } from "next-auth/react"
import toast from "react-hot-toast"
import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useChangePasswordMutation, useSetPasswordMutation, useGetMyAccountQuery } from "@/lib/redux/api/authApi"
import DashboardHeader from "@/app/components/DashboardHeader"

type Provider = "credentials" | "google" | "both"
interface ExtendedUser { provider?: Provider }

function Skeleton() {
  return (
    <>
      <DashboardHeader />
      <div className="max-w-2xl mx-auto p-6 space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded-lg"></div>
        
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <div className="h-5 w-32 bg-gray-200 rounded"></div>
          <div className="h-12 w-full bg-gray-100 rounded-lg"></div>
          <div className="h-12 w-full bg-gray-100 rounded-lg"></div>
        </div>

        <div className="bg-white border rounded-xl p-5 space-y-3">
          <div className="h-5 w-40 bg-gray-200 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
          <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
          <div className="h-10 w-full bg-gray-300 rounded-lg"></div>
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
      setCurr("")
      setNext("")
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

  if (accountLoading) {
    return <Skeleton />
  }

  const isGoogle = provider === "google"
  const isBoth = provider === "both"
  const isCredentials = provider === "credentials"

  return (
    <>
      <DashboardHeader />
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Login Methods</h2>
          <div className="flex justify-between items-center border p-3 rounded-lg text-sm">
            <span>Password: {isCredentials || isBoth ? "✅ Enabled" : "❌ Not set"}</span>
          </div>
          <div className="flex justify-between items-center border p-3 rounded-lg text-sm">
            <span>Google: {isGoogle || isBoth ? "✅ Linked" : "❌ Not linked"}</span>
            {isCredentials && (
              <button 
                onClick={() => signIn("google", { callbackUrl: "/dashboard/settings" })} 
                className="border px-3 py-1 rounded text-xs hover:bg-gray-50"
              >
                Link Google
              </button>
            )}
          </div>
          {isBoth && <p className="text-xs text-green-600 bg-green-50 p-2 rounded">✅ Both methods enabled</p>}
          {!provider && <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">Loading provider...</p>}
        </div>

        {(isCredentials || isBoth) && (
          <form onSubmit={onChangePass} className="bg-white border rounded-xl p-5 space-y-3">
            <h2 className="font-semibold">Change Password</h2>
            <input type="password" placeholder="Current password" value={curr} onChange={e=>setCurr(e.target.value)} className="w-full border px-3 py-2 rounded-lg" required />
            <input type="password" placeholder="New password" value={next} onChange={e=>setNext(e.target.value)} className="w-full border px-3 py-2 rounded-lg" required />
            <button disabled={changing} className="bg-black text-white px-4 py-2 rounded-lg text-sm w-full disabled:opacity-50">{changing? "Updating..." : "Update Password"}</button>
          </form>
        )}

        {isGoogle && (
          <form onSubmit={onSetPass} className="bg-white border rounded-xl p-5 space-y-3">
            <h2 className="font-semibold">Set Password to enable both</h2>
            <p className="text-xs text-gray-500">Add a password to login with both methods</p>
            <input type="password" placeholder="New password" value={newForGoogle} onChange={e=>setNewForGoogle(e.target.value)} className="w-full border px-3 py-2 rounded-lg" required />
            <button disabled={setting} className="bg-black text-white px-4 py-2 rounded-lg text-sm w-full disabled:opacity-50">{setting? "Saving..." : "Set Password"}</button>
          </form>
        )}
      </div>
    </>
  )
}




{/* 3. PREFERENCES */}
      {/* <div className="bg-white border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold">Preferences</h2>
        <div className="flex justify-between items-center">
          <span className="text-sm">Email notifications for new jobs</span>
          <input type="checkbox" defaultChecked />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">Marketing emails</span>
          <input type="checkbox" />
        </div>
      </div> */}