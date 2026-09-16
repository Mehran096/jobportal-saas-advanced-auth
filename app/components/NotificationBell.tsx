"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGetNotificationsQuery, useMarkAsReadMutation } from '@/lib/redux/api/notificationsApi';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data, isLoading } = useGetNotificationsQuery(undefined, {
    pollingInterval: 10000, // Auto check for new notifications every 10 sec
    refetchOnFocus: true, // Refetch when user comes back to tab
    refetchOnReconnect: true,
  });
  const [markAsRead] = useMarkAsReadMutation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current &&!dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClick = async (id: string, link: string) => {
    try {
      await markAsRead(id).unwrap(); // Mark as read first
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
    setOpen(false);
    router.push(link); // Then redirect
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="relative p-2 hover:bg-gray-100 rounded-full">
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="
        fixed
        sm:absolute
        top-16
        sm:top-12
        right-2
        sm:right-0
        w-[calc(100vw-1rem)]
        sm:w-80
        max-w-sm
        bg-white shadow-2xl rounded-lg p-2 z-50 border max-h-96 overflow-y-auto
      ">
          <h3 className="font-bold px-2 py-1 border-b">Notifications</h3>
          {isLoading? <p className="p-2">Loading...</p> :
          notifications.length === 0? <p className="p-2 text-gray-500 text-center">No notifications</p> :
            notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => handleClick(n._id, n.link)}
                className={`w-full text-left block p-3 hover:bg-gray-100 rounded mb-1 transition ${!n.isRead? 'bg-blue-50 font-semibold' : ''}`}
              >
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</p>
              </button>
            ))
          }
        </div>
      )}
    </div>
  )
}