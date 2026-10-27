import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-lg font-semibold text-slate-900">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Back to dashboard
      </Link>
    </Card>
  );
}
