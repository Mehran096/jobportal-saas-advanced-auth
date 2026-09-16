import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';

// Import all feature APIs to register them with baseApi
import './api/authApi';
import './api/jobseekerApi';
import './api/employerApi';
import './api/notificationsApi';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer, // single baseApi reducer for all endpoints
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware), // single middleware for cache, refetch
  devTools: process.env.NODE_ENV!== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;