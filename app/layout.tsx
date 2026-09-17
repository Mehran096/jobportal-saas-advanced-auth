import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Portal SaaS",
  description: "Find your dream job",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "12px",
                background: "#111827",
                color: "#fff",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#22c55e", secondary: "#fff" }
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" }
              }
            }}
          />
        </Providers>
      </body>
    </html>
  );
}