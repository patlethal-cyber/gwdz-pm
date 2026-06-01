'use client'

import Sidebar from "@/components/layout/Sidebar";
import { DataProvider } from "@/lib/data-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <Sidebar />
      <main className="ml-[240px] min-h-screen transition-all duration-300">
        {children}
      </main>
    </DataProvider>
  );
}
