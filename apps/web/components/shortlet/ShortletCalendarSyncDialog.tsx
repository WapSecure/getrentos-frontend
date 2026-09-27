'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Select,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { AlertTriangle, Copy, RefreshCw, Trash2 } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletKeys } from '@/lib/queryKeys';
import { formatRelativeTime } from '@/lib/format';
import { shortletService } from '@/services/shortletService';
import type { ShortletCalendarFeed, ShortletListing } from '@/types/shortlet';

const SOURCES = ['Airbnb', 'Booking.com', 'VRBO', 'Google Calendar', 'Other'];

/** Where each site hides its calendar export link, in the host's own words. */
const WHERE_TO_FIND: Record<string, string> = {
  Airbnb: 'Airbnb: Calendar → Availability → Connect calendars → Export calendar.',
  'Booking.com': 'Booking.com: Rates & Availability → Sync calendars → Export calendar.',
  VRBO: 'VRBO: Calendar → Import/Export → Export calendar.',
  'Google Calendar': 'Google Calendar: Settings → the calendar → Secret address in iCal format.',
  Other: 'Look for "Export calendar" or an iCal (.ics) link in the other site’s calendar settings.',
};

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

/**
 * Two-way calendar sync for one listing, so a stay booked on another site can't
 * be booked here too, and the other way round.
 */
export function ShortletCalendarSyncDialog({
  listing,
  onClose,
}: {
  listing: ShortletListing;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [source, setSource] = useState('Airbnb');
  const [customName, setCustomName] = useState('');
  const [url, setUrl] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const key = shortletKeys.hostCalendarSync(listing.id);
  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => unwrap(shortletService.calendarSync(listing.id)),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: shortletKeys.hostBlockedDates(listing.id) });
    queryClient.invalidateQueries({ queryKey: shortletKeys.public });
  };
  const fail = (e: Error) => setToast({ message: e.message, variant: 'error' });

  const addFeed = useMutation({
    mutationFn: () =>
      unwrap(
        shortletService.addCalendarFeed(listing.id, {
          name: source === 'Other' ? customName.trim() : source,
          url: url.trim(),
        })
      ),
    onSuccess: (feed) => {
      setUrl('');
      setCustomName('');
      refresh();
      setToast({
        message: `${feed.name} connected: ${feed.eventCount} upcoming stay${feed.eventCount === 1 ? '' : 's'} blocked.`,
        variant: 'success',
      });
    },
    onError: fail,
  });

  const syncFeed = useMutation({
    mutationFn: (id: string) => unwrap(shortletService.syncCalendarFeed(id)),
    onSuccess: (feed) => {
      refresh();
      setToast(
        feed.lastError
          ? { message: feed.lastError, variant: 'error' }
          : { message: `${feed.name} synced.`, variant: 'success' }
      );
    },
    onError: fail,
  });

  const removeFeed = useMutation({
    mutationFn: (id: string) => unwrap(shortletService.removeCalendarFeed(id)),
    onSuccess: () => {
      refresh();
      setToast({ message: 'Calendar disconnected and its dates freed.', variant: 'success' });
    },
    onError: fail,
  });

  const resetExport = useMutation({
    mutationFn: () => unwrap(shortletService.resetCalendarExport(listing.id)),
    onSuccess: () => {
      setConfirmReset(false);
      refresh();
      setToast({
        message: 'New link created. Paste it into the other sites again.',
        variant: 'success',
      });
    },
    onError: fail,
  });

  const copyLink = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.exportUrl);
      setToast({ message: 'Link copied.', variant: 'success' });
    } catch {
      setToast({
        message: 'Could not copy. Select the link and copy it by hand.',
        variant: 'error',
      });
    }
  };

  const submit = () => {
    if (source === 'Other' && !customName.trim()) {
      return setToast({
        message: 'Name the calendar, e.g. the site it comes from.',
        variant: 'error',
      });
    }
    if (!url.trim()) return setToast({ message: 'Paste the calendar link.', variant: 'error' });
    addFeed.mutate();
  };

  const feeds: ShortletCalendarFeed[] = data?.feeds ?? [];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <div className="p-5">
          <DialogTitle>Calendar sync · {listing.title}</DialogTitle>
          <DialogDescription>
            Listed on Airbnb or Booking.com too? Connect the calendars both ways so the same night
            can&rsquo;t be booked twice.
          </DialogDescription>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto border-t border-border p-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{(error as Error).message}</p>
          ) : (
            <>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">1. Send your GetRentos bookings out</h3>
                <p className="text-xs text-muted-foreground">
                  Paste this link into the other site&rsquo;s &ldquo;Import calendar&rdquo; setting.
                  It shows your GetRentos bookings and the dates you block by hand, without guest
                  names. Other sites usually re-read it every few hours.
                </p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={data?.exportUrl ?? ''}
                    onFocus={(e) => e.currentTarget.select()}
                    className="font-mono text-xs"
                    aria-label="GetRentos calendar link"
                  />
                  <Button variant="outline" onClick={copyLink} aria-label="Copy link">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {confirmReset ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3 text-xs">
                    <span className="flex-1">
                      Sites using the old link will stop getting your bookings until you paste the
                      new one.
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmReset(false)}
                      disabled={resetExport.isPending}
                    >
                      Keep link
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => resetExport.mutate()}
                      disabled={resetExport.isPending}
                    >
                      {resetExport.isPending ? 'Resetting…' : 'Reset link'}
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="cursor-pointer text-xs text-muted-foreground underline underline-offset-2"
                    onClick={() => setConfirmReset(true)}
                  >
                    Shared this link by mistake? Reset it
                  </button>
                )}
              </section>

              <section className="space-y-3 border-t border-border pt-5">
                <h3 className="text-sm font-semibold">2. Bring other bookings in</h3>
                <p className="text-xs text-muted-foreground">
                  Stays on connected calendars block those nights here. We check each calendar every
                  30 minutes.
                </p>

                {feeds.length > 0 && (
                  <div className="space-y-2">
                    {feeds.map((feed) => (
                      <div
                        key={feed.id}
                        className="rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{feed.name}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {hostOf(feed.url)}
                              </span>
                              {feed.lastError ? (
                                <Badge variant="danger">Not syncing</Badge>
                              ) : (
                                <Badge variant="success">Connected</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {feed.eventCount} upcoming stay{feed.eventCount === 1 ? '' : 's'}{' '}
                              blocked
                              {feed.lastSyncedAt
                                ? ` · checked ${formatRelativeTime(feed.lastSyncedAt)}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Sync ${feed.name} now`}
                              onClick={() => syncFeed.mutate(feed.id)}
                              disabled={syncFeed.isPending}
                            >
                              <RefreshCw
                                className={`h-4 w-4 ${syncFeed.isPending && syncFeed.variables === feed.id ? 'animate-spin' : ''}`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Disconnect ${feed.name}`}
                              onClick={() => removeFeed.mutate(feed.id)}
                              disabled={removeFeed.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {feed.lastError && (
                          <p className="mt-1 text-xs text-destructive">
                            {feed.lastError} Dates it blocked before stay blocked until it syncs
                            again.
                          </p>
                        )}
                        {feed.conflictCount > 0 && (
                          <p className="mt-1 flex items-start gap-1.5 text-xs text-warning">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {feed.conflictCount} stay{feed.conflictCount === 1 ? '' : 's'} on{' '}
                            {feed.name} overlap{feed.conflictCount === 1 ? 's' : ''} a GetRentos
                            booking. Check your bookings and cancel one of each pair.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Calendar from">
                      <Select
                        value={source}
                        onValueChange={setSource}
                        options={SOURCES.map((s) => ({ value: s, label: s }))}
                      />
                    </Field>
                    {source === 'Other' && (
                      <Field label="Name">
                        <Input
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="e.g. Hotels.ng"
                          maxLength={40}
                        />
                      </Field>
                    )}
                  </div>
                  <Field label="Calendar link (.ics)" hint={WHERE_TO_FIND[source]}>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://…"
                      inputMode="url"
                    />
                  </Field>
                  <Button className="w-full" onClick={submit} disabled={addFeed.isPending}>
                    {addFeed.isPending ? 'Checking the calendar…' : 'Connect calendar'}
                  </Button>
                </div>
              </section>
            </>
          )}
        </div>

        {toast && (
          <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
