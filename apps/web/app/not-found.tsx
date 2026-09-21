'use client';

import { ArrowLeft, Home, SearchX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@getrentos/ui/Button';
import { Logo } from '@getrentos/ui/Logo';
import { ROUTES } from '@getrentos/shared';

export default function NotFound() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace(ROUTES.HOME);
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-10">
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 right-[-6rem] h-72 w-72 rounded-full bg-info/10 blur-3xl"
      />

      <section className="relative w-full max-w-lg rounded-[28px] border border-border/70 bg-card/85 p-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.10)] backdrop-blur-xl sm:p-10">
        <Logo href={ROUTES.HOME} size="md" className="mx-auto w-fit" />

        <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
          <SearchX aria-hidden="true" className="h-7 w-7" strokeWidth={1.8} />
        </div>

        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Error 404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
          This page isn&apos;t here.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          The link may be outdated, or the address may have been entered incorrectly. Let&apos;s get
          you back on track.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            href={ROUTES.HOME}
            variant="primary"
            className="min-w-40"
            icon={<Home className="h-4 w-4" />}
          >
            Go to GetRentos
          </Button>
          <Button
            variant="outline"
            className="min-w-32"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={handleBack}
          >
            Go back
          </Button>
        </div>
      </section>
    </main>
  );
}
