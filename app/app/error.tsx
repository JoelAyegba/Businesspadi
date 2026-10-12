"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for debugging
    console.error("App error:", error);
  }, [error]);

  const isDatabaseError = error.message.includes("database") ||
    error.message.includes("Can't reach") ||
    error.message.includes("PrismaClientInitializationError");

  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
        </div>

        {isDatabaseError && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Database Connection Issue</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              We can&apos;t connect to the database. This usually means:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 mb-4">
              <li>• The database server is temporarily unavailable</li>
              <li>• Your connection credentials have expired</li>
              <li>• The database endpoint is suspended (if using Neon&apos;s free tier)</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Try reloading the page. If the problem persists, check your database status and connection string in your environment variables.
            </p>
          </div>
        )}

        {!isDatabaseError && isDevelopment && (
          <div className="mb-6 rounded-lg bg-muted p-4">
            <p className="text-xs font-mono text-muted-foreground break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {!isDatabaseError && !isDevelopment && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Our team has been notified. Please try again in a few moments.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={reset}
            className="flex-1"
            variant="default"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1"
          >
            <Link href="/app/dashboard" className="flex items-center justify-center">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
