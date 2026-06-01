import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GWDZ PM — 国微电子项目管理",
  description: "国微电子 HIAgent AI 智能体项目管理平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geist.variable} h-full`}>
      <body className="h-full bg-gray-50 antialiased">
        <Sidebar />
        <main className="ml-[240px] min-h-screen transition-all duration-300">
          {children}
        </main>
      </body>
    </html>
  );
}
