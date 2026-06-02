'use client'

import { Suspense } from 'react'
import Sidebar from "@/components/layout/Sidebar";
import { DataProvider } from "@/lib/data-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={
            <div className="p-6">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          }>
            {children}
          </Suspense>
        </main>
      </div>
    </DataProvider>
  );
}
