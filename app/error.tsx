"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-slate-900">Something went wrong</h1>
      <p className="mt-1 text-sm text-slate-500">An unexpected error occurred while rendering this page.</p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}
