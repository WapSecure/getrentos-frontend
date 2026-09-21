import { Smartphone } from 'lucide-react';

/**
 * The app is not in the stores yet, so this says so. It used to offer App Store
 * and Google Play buttons that did nothing, and a "scan to download" box that was
 * not a QR code. Swap in the real store links here when the apps are published.
 */
export const DownloadApp = () => (
  <section id="download" className="px-4 py-20">
    <div className="mx-auto max-w-7xl">
      <div className="rounded-2xl border border-border bg-secondary p-8 md:p-12">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-block rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-primary dark:bg-white/10">
              MOBILE APP · COMING SOON
            </div>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              The GetRentos app is on its way
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              We&apos;re building the mobile app for iOS and Android. Until it lands in the stores,
              everything works in your phone&apos;s browser, so you can list, search, apply and pay
              from wherever you are.
            </p>
          </div>
          <div className="flex justify-center" aria-hidden="true">
            <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-border bg-white shadow-sm dark:bg-white/5">
              <Smartphone className="h-20 w-20 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
