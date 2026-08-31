"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button, Logo } from "@getrentos/ui";
import { ROUTES } from "@getrentos/shared";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string; requestId?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled backoffice error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <section className="w-full max-w-lg rounded-[28px] border border-border bg-card p-8 text-center shadow-xl">
        <Logo href={ROUTES.ADMIN_LOGIN} size="md" className="mx-auto w-fit" />
        <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle aria-hidden="true" className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-foreground">
          This page couldn&apos;t load
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          No changes were made. Try loading the page again or return to sign in.
        </p>
        {error.requestId || error.digest ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Reference: {error.requestId ?? error.digest}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            variant="primary"
            onClick={reset}
            icon={<RefreshCcw className="h-4 w-4" />}
          >
            Try again
          </Button>
          <Button href={ROUTES.ADMIN_LOGIN} variant="outline">
            Admin sign in
          </Button>
        </div>
      </section>
    </main>
  );
}
