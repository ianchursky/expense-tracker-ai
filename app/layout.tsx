import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { SampleDataNotice } from "@/components/layout/SampleDataNotice";
import { StorageStatus } from "@/components/layout/StorageStatus";
import { StorageWarning } from "@/components/layout/StorageWarning";
import { ExpenseDialogProvider } from "@/components/providers/ExpenseDialogProvider";
import { ExpenseProvider } from "@/components/providers/ExpenseProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Expense Tracker",
    template: "%s · Expense Tracker",
  },
  description: "Track, filter, and analyze your personal expenses.",
};

export const viewport: Viewport = {
  themeColor: "#15803d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <ToastProvider>
          <ExpenseProvider>
            <ExpenseDialogProvider>
              <Navbar />
              <div className="lg:pl-60">
                <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:py-8">
                  <StorageWarning />
                  <SampleDataNotice />
                  {children}
                  <div className="mt-8 lg:hidden">
                    <StorageStatus variant="inline" />
                  </div>
                </main>
              </div>
            </ExpenseDialogProvider>
          </ExpenseProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
