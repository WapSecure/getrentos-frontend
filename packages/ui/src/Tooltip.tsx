'use client';

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@sureground/shared';

export interface TooltipProps {
  /** Short text: what the control does ("Mark resolved"), not how it looks. */
  content: ReactNode;
  /** One focusable element, e.g. an IconButton. It receives aria-describedby. */
  children: ReactElement<Record<string, unknown>>;
  side?: 'top' | 'bottom';
  /** Hover delay; keyboard focus shows it at once. */
  delay?: number;
  className?: string;
}

const GAP = 8;

/**
 * Shown on hover and keyboard focus, hoverable, and dismissed with Escape (WCAG 1.4.13).
 * Rendered in a portal so card overflow never clips it. Not a substitute for a visible label
 * on controls that change data; those need text and, when consequential, a confirmation.
 */
export function Tooltip({ content, children, side = 'top', delay = 250, className }: TooltipProps) {
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; side: 'top' | 'bottom' } | null>(
    null
  );

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const show = useCallback(
    (immediate = false) => {
      clear();
      if (immediate) setOpen(true);
      else timer.current = setTimeout(() => setOpen(true), delay);
    },
    [delay]
  );
  const hide = useCallback(() => {
    clear();
    timer.current = setTimeout(() => setOpen(false), 80);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const fitsAbove = rect.top > 48;
    const placed = side === 'top' && fitsAbove ? 'top' : 'bottom';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- position comes from layout
    setPos({
      left: rect.left + rect.width / 2,
      top: placed === 'top' ? rect.top - GAP : rect.bottom + GAP,
      side: placed,
    });
  }, [open, side]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  useEffect(() => clear, []);

  if (!isValidElement(children)) return children;

  const childProps = children.props as Record<string, unknown>;
  const chain = (name: string, fn: (event: never) => void) => (event: never) => {
    (childProps[name] as ((e: never) => void) | undefined)?.(event);
    fn(event);
  };

  const trigger = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      // React 19 passes ref as a prop.
      const childRef = childProps.ref;
      if (typeof childRef === 'function') childRef(node);
      else if (childRef && typeof childRef === 'object')
        (childRef as { current: HTMLElement | null }).current = node;
    },
    'aria-describedby': open
      ? [childProps['aria-describedby'], id].filter(Boolean).join(' ')
      : childProps['aria-describedby'],
    onPointerEnter: chain('onPointerEnter', () => show()),
    onPointerLeave: chain('onPointerLeave', hide),
    onFocus: chain('onFocus', (event: { currentTarget: HTMLElement }) => {
      if (event.currentTarget.matches(':focus-visible')) show(true);
    }),
    onBlur: chain('onBlur', () => setOpen(false)),
    onClick: chain('onClick', () => setOpen(false)),
  });

  return (
    <>
      {trigger}
      {open && pos && typeof document !== 'undefined'
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              onPointerEnter={() => show(true)}
              onPointerLeave={hide}
              style={{ top: pos.top, left: pos.left }}
              className={cn(
                'fixed z-[100] max-w-xs -translate-x-1/2 rounded-sm bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-md',
                pos.side === 'top' && '-translate-y-full',
                className
              )}
            >
              {content}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
