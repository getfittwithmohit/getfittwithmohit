import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FeedbackHost } from "@/lib/ui/feedback";
import { TabBar } from "@/components/nav/TabBar";
import { RouterBridge } from "@/components/nav/RouterBridge";
import { FeelHost } from "@/components/nav/FeelHost";

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
    default: "GFM 1:1 Coaching",
    template: "%s · GFM 1:1 Coaching",
  },
  description: "Your 1:1 transformation and peak performance coaching app with Coach Mohit.",
  applicationName: "GFM 1:1 Coaching",
  appleWebApp: {
    capable: true,
    title: "GFM 1:1",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "GFM 1:1 Coaching · GetFittWithMohit",
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
        <TabBar />
        <RouterBridge />
        <FeelHost />
        <FeedbackHost />
      </body>
    </html>
  );
}
