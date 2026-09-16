import { baseApi } from "./baseApi";

interface Notification {
  _id: string;
  user: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const notificationsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // 1. Saari notifications get karna
    getNotifications: builder.query<NotificationsResponse, void>({
        query: () => '/notifications',
        providesTags: ['Notifications'],
        // refetchOnFocus: true,
        // refetchOnReconnect: true,
    }),

    // 2. Mark as read - Body me id jayegi
    markAsRead: builder.mutation<{message: string}, string>({
      query: (id: string) => ({
        url: `/notifications`, // 👈 same url
        method: 'PATCH',
        body: { id } // 👈 id body me
      }),
      invalidatesTags: ['Notifications'] // isse bell ka count auto update ho jayega
    })
  })
});

export const { useGetNotificationsQuery, useMarkAsReadMutation } = notificationsApi;