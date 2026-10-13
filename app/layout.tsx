import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MemberProvider } from "@/components/linkpick/member/MemberProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Today - 로컬 팩트 미디어 & 워크OS",
  description:
    "한국AI인테리어공간협회가 주관하는 전국 로컬 행정 고시 및 인프라 팩트 피드, 투데이(today.or.kr)",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/today-192.png",
    apple: "/icons/today-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Today",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-white antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-zinc-900">
        <MemberProvider>{children}</MemberProvider>
      </body>
    </html>
  );
}
