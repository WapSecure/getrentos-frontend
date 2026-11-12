'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import {
  coarseUtmValue,
  referrerHostOf,
  type FunnelEventProps,
  type WebVitalMetric,
} from '@sureground/shared/showroom';
import { track } from '@/lib/analytics';
import { routeTemplate } from '@/lib/routeTemplate';

const TOUCH_KEY = 'sureground.analytics.touch';
const VITALS_KEY = 'sureground.analytics.vitals';
/** Share of tab sessions that report web vitals; decided once per session so a session is all in or all out. */
const VITALS_SAMPLE_RATE = 0.5;
const METRICS: readonly WebVitalMetric[] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Private mode: measure this page only.
  }
}

/** Where the visit came from, captured once per tab: UTM tags and the referring host, nothing else. */
function firstTouch(): FunnelEventProps | null {
  if (readSession(TOUCH_KEY)) return null;
  const query = new URLSearchParams(window.location.search);
  const touch: FunnelEventProps = {};
  const utmSource = coarseUtmValue(query.get('utm_source'));
  const utmMedium = coarseUtmValue(query.get('utm_medium'));
  const utmCampaign = coarseUtmValue(query.get('utm_campaign'));
  const referrerHost = referrerHostOf(document.referrer, window.location.hostname);
  if (utmSource) touch.utmSource = utmSource;
  if (utmMedium) touch.utmMedium = utmMedium;
  if (utmCampaign) touch.utmCampaign = utmCampaign;
  if (referrerHost) touch.referrerHost = referrerHost;
  writeSession(TOUCH_KEY, JSON.stringify(touch));
  return touch;
}

function vitalsSampled(): boolean {
  const saved = readSession(VITALS_KEY);
  if (saved) return saved === '1';
  const inSample = Math.random() < VITALS_SAMPLE_RATE;
  writeSession(VITALS_KEY, inSample ? '1' : '0');
  return inSample;
}

/**
 * Anonymous site measurement, mounted once in the root layout: one `session_start` per tab with the
 * landing route pattern and first-touch campaign fields, and Core Web Vitals for a sample of sessions.
 */
export function SiteMeasurement() {
  const pathname = usePathname();
  const params = useParams();
  const template = routeTemplate(pathname ?? '/', params);
  const path = useRef(template);
  useEffect(() => {
    path.current = template;
  }, [template]);

  useEffect(() => {
    const touch = firstTouch();
    if (touch) track({ name: 'session_start', props: { ...touch, path: path.current } });
  }, []);

  const report = useCallback((metric: { name: string; value: number; rating?: string }) => {
    if (!METRICS.includes(metric.name as WebVitalMetric) || !vitalsSampled()) return;
    const value = Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value);
    if (!Number.isFinite(value) || value < 0 || value > 600_000) return;
    const rating =
      metric.rating === 'good' || metric.rating === 'needs-improvement' || metric.rating === 'poor'
        ? metric.rating
        : undefined;
    track({
      name: 'web_vital',
      props: { metric: metric.name as WebVitalMetric, value, rating, path: path.current },
    });
  }, []);
  useReportWebVitals(report);

  return null;
}
