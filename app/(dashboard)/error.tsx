"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      // TODO: Send to error tracking service
    }
  }, [error]);

  return (
    <div className="p-8">
      <div className="max-w-lg mx-auto">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Dashboard Error
          </h2>
          <p className="text-red-700 dark:text-red-300 text-sm mb-6">
            Something went wrong loading this page. Please try again.
          </p>
          <Button
            onClick={reset}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
