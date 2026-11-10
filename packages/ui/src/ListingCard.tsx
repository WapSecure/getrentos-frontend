'use client';

import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { BadgeCheck, ImageOff } from '@sureground/icons';
import { cn, formatCurrency, tidyPlace } from '@sureground/shared';
import { Badge, type BadgeVariant } from './Badge';
import { IconButton, type IconButtonProps } from './IconButton';

export type ListingCardVariant = 'grid' | 'compact' | 'map';
export type ListingPriceUnit = 'year' | 'month' | 'week' | 'night' | 'total';

export interface ListingCardFacts {
  beds?: number | null;
  baths?: number | null;
  /** A number is square metres; a string is shown as given (e.g. "2 plots"). */
  size?: number | string | null;
  type?: string | null;
  extra?: Array<string | null | undefined | false>;
}

export interface ListingCardProps {
  title: string;
  /** The whole card links here. Without it, `onOpen` makes the title a button. */
  href?: string;
  /** Runs on open: alongside navigation when `href` is set, instead of it otherwise. */
  onOpen?: () => void;
  /** Runs once, when half the card has been on screen (for impression counts). */
  onVisible?: () => void;
  location?: string | null;
  price?: number | null;
  priceUnit?: ListingPriceUnit;
  priceCompact?: boolean;
  priceNote?: ReactNode;
  image?: string | null;
  imageAlt?: string;
  /** For the first row above the fold. */
  eager?: boolean;
  status?: string;
  statusVariant?: BadgeVariant;
  /** Extra badges after the status, e.g. a trust-chain badge. */
  badges?: ReactNode;
  /** Pass the backend's flag only; never infer it. */
  verified?: boolean;
  facts?: ListingCardFacts;
  /** Save, compare or share buttons owned by the caller; they never trigger navigation. */
  actions?: ReactNode;
  /** Quiet extra line(s) under the facts, e.g. "Listed 3 days ago". */
  meta?: ReactNode;
  /** Buttons under the card body. */
  footer?: ReactNode;
  variant?: ListingCardVariant;
  selected?: boolean;
  headingLevel?: 'h2' | 'h3' | 'h4';
  className?: string;
}

// Solid, not translucent: it has to read on any photo in both themes.
export const listingCardActionClass =
  'rounded-full border border-border/60 bg-card text-foreground shadow-sm backdrop-blur-none hover:scale-100 hover:bg-card hover:text-foreground focus-visible:ring-primary aria-pressed:text-destructive pointer-coarse:h-11 pointer-coarse:w-11';

/** A save, share or compare button sized and styled to sit on the card photo. */
export const ListingCardAction = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'md', ...props }, ref) => (
    <IconButton
      ref={ref}
      size={size}
      className={cn(listingCardActionClass, className)}
      {...props}
    />
  )
);
ListingCardAction.displayName = 'ListingCardAction';

const UNIT_SUFFIX: Record<ListingPriceUnit, string> = {
  year: '/year',
  month: '/month',
  week: '/week',
  night: '/night',
  total: ' total',
};

const sentenceCase = (value: string) => {
  const words = value.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const plural = (n: number, one: string) => `${n.toLocaleString()} ${one}${n === 1 ? '' : 's'}`;

// Falsy, not nullish: "0 beds" or "0 m²" reads as a claim when the data is just missing.
export const listingFactsLine = (facts?: ListingCardFacts): string[] => {
  if (!facts) return [];
  return [
    facts.beds ? plural(facts.beds, 'bed') : null,
    facts.baths ? plural(facts.baths, 'bath') : null,
    typeof facts.size === 'number'
      ? facts.size > 0
        ? `${facts.size.toLocaleString()} m²`
        : null
      : facts.size || null,
    facts.type ? sentenceCase(facts.type) : null,
    ...(facts.extra ?? []),
  ].filter((f): f is string => Boolean(f));
};

const ListingImage = ({
  src,
  alt,
  eager,
  compact,
}: {
  src?: string | null;
  alt: string;
  eager?: boolean;
  compact?: boolean;
}) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-muted text-muted-foreground">
        <ImageOff className={compact ? 'h-5 w-5' : 'h-6 w-6'} aria-hidden="true" />
        {!compact && <span className="text-2xs">No photo yet</span>}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- signed storage URLs
    <img
      src={src}
      alt={alt}
      width={800}
      height={600}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
      onError={() => setBroken(true)}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
    />
  );
};

function useVisibleOnce(onVisible?: () => void) {
  const handler = useRef(onVisible);
  const [element, setElement] = useState<HTMLElement | null>(null);
  const wanted = Boolean(onVisible);
  useEffect(() => {
    handler.current = onVisible;
  });
  useEffect(() => {
    if (!element || !wanted || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          handler.current?.();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, wanted]);
  return setElement;
}

export const ListingCard = ({
  title,
  href,
  onOpen,
  onVisible,
  location,
  price,
  priceUnit,
  priceCompact = false,
  priceNote,
  image,
  imageAlt,
  eager = false,
  status,
  statusVariant = 'neutral',
  badges,
  verified = false,
  facts,
  actions,
  meta,
  footer,
  variant = 'grid',
  selected = false,
  headingLevel: Heading = 'h3',
  className,
}: ListingCardProps) => {
  const isGrid = variant === 'grid';
  const isMap = variant === 'map';
  const visibleRef = useVisibleOnce(onVisible);
  const factsLine = listingFactsLine(facts);
  const hasPrice = typeof price === 'number' && Number.isFinite(price);

  // An overlay on the title stretches its hit area over the card; anything with z-10 stays separately clickable.
  const titleTarget =
    'min-w-0 rounded-sm text-left outline-none after:absolute after:inset-0 after:rounded-xl after:content-[""]';
  const titleText = <span className="block truncate">{title}</span>;
  const titleNode = href ? (
    <Link href={href} onClick={onOpen} data-listing-link="" className={titleTarget}>
      {titleText}
    </Link>
  ) : onOpen ? (
    <button type="button" onClick={onOpen} data-listing-link="" className={titleTarget}>
      {titleText}
    </button>
  ) : (
    titleText
  );

  const priceNode = hasPrice ? (
    <p
      className={cn(
        'data-value shrink-0 whitespace-nowrap font-semibold text-foreground',
        isMap ? 'text-sm' : 'text-base'
      )}
    >
      {formatCurrency(price, { compact: priceCompact })}
      {priceUnit && (
        <span className="text-xs font-normal text-muted-foreground">{UNIT_SUFFIX[priceUnit]}</span>
      )}
    </p>
  ) : null;

  const statusBadges =
    status || badges ? (
      <div className="relative z-10 flex min-w-0 flex-wrap items-start gap-1.5">
        {status && (
          <Badge
            variant={statusVariant}
            className={cn(
              'shadow-xs',
              statusVariant === 'neutral' && 'border-transparent bg-card text-foreground'
            )}
          >
            {status}
          </Badge>
        )}
        {badges}
      </div>
    ) : null;

  const heading = (
    <Heading
      className={cn(
        'flex min-w-0 items-center gap-1 font-semibold tracking-[-0.01em] text-foreground',
        isMap ? 'text-sm' : 'text-base'
      )}
    >
      {titleNode}
      {verified && (
        <BadgeCheck
          className="h-4 w-4 shrink-0 text-primary"
          role="img"
          aria-label="Verified listing"
        />
      )}
    </Heading>
  );

  const details = (
    <>
      {location && (
        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{tidyPlace(location)}</p>
      )}
      {factsLine.length > 0 && (
        <p
          className={cn(
            'data-value flex flex-wrap gap-x-1.5 text-xs text-muted-foreground',
            isGrid ? 'mt-3 border-t border-border/70 pt-3' : 'mt-1.5'
          )}
        >
          {factsLine.map((fact, i) => (
            <span key={`${fact}-${i}`} className="whitespace-nowrap">
              {i > 0 && (
                <span aria-hidden="true" className="mr-1.5">
                  ·
                </span>
              )}
              {fact}
            </span>
          ))}
        </p>
      )}
      {priceNote && <div className="mt-1.5 text-xs text-muted-foreground">{priceNote}</div>}
      {meta && <div className="relative z-10 mt-2.5 text-xs text-muted-foreground">{meta}</div>}
    </>
  );

  const ring =
    'has-[[data-listing-link]:focus-visible]:ring-2 has-[[data-listing-link]:focus-visible]:ring-primary has-[[data-listing-link]:focus-visible]:ring-offset-2 has-[[data-listing-link]:focus-visible]:ring-offset-background';

  if (isGrid) {
    return (
      <article
        ref={visibleRef}
        className={cn(
          'group relative flex min-w-0 flex-col rounded-xl',
          selected && 'ring-2 ring-primary ring-offset-4 ring-offset-background',
          ring,
          className
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
          <ListingImage key={image ?? ''} src={image} alt={imageAlt ?? ''} eager={eager} />
        </div>
        <div className="flex flex-1 flex-col px-0.5 pt-3.5">
          <div className="flex items-baseline justify-between gap-3">
            {heading}
            {priceNode}
          </div>
          {details}
          {footer && <div className="relative z-10 mt-auto pt-4">{footer}</div>}
        </div>
        {/* After the body in the DOM so Tab reaches the title before the photo actions. */}
        {(statusBadges || actions) && (
          <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2 [&>*]:pointer-events-auto">
            {statusBadges ?? <span />}
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
        )}
      </article>
    );
  }

  return (
    <article
      ref={visibleRef}
      className={cn(
        '@container group relative flex min-w-0 gap-3 overflow-hidden rounded-xl border bg-card p-2.5 text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 hover:border-foreground/15 hover:shadow-sm',
        selected ? 'border-primary shadow-[inset_0_0_0_1px_var(--primary)]' : 'border-border',
        ring,
        className
      )}
      aria-current={(isMap && selected) || undefined}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-lg bg-muted',
          isMap ? 'h-16 w-20' : 'aspect-[4/3] w-20 self-start @[22rem]:w-28 @[34rem]:w-40'
        )}
      >
        <ListingImage key={image ?? ''} src={image} alt={imageAlt ?? ''} eager={eager} compact />
        {!isMap && statusBadges && (
          <div className="absolute left-2 top-2 hidden @[22rem]:block">{statusBadges}</div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-0.5 pr-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {heading}
            {priceNode && <div className="mt-0.5">{priceNode}</div>}
          </div>
          {actions && (
            <div className="relative z-10 flex shrink-0 items-center gap-1">{actions}</div>
          )}
        </div>
        {details}
        {footer && <div className="relative z-10 mt-auto pt-3">{footer}</div>}
      </div>
    </article>
  );
};
