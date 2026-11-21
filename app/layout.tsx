import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FeedbackHost } from "@/lib/ui/feedback";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GetFittWithMohit",
    template: "%s · GetFittWithMohit",
  },
  description: "Your 1:1 transformation and peak performance coaching app with Coach Mohit.",
  applicationName: "GetFittWithMohit",
  appleWebApp: {
    capable: true,
    title: "GetFittWithMohit",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "GetFittWithMohit",
    description: "Your 1:1 transformation and peak performance coaching app with Coach Mohit.",
    images: ["/icons/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1f3a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <FeedbackHost />
      </body>
    </html>
  );
}
