import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
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
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <ToastProvider>
          <ExpenseProvider>
            <ExpenseDialogProvider>
              <Navbar />
              <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <StorageWarning />
                {children}
              </main>
            </ExpenseDialogProvider>
          </ExpenseProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
