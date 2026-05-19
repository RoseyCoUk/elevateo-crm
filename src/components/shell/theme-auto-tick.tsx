'use client';

import { useEffect } from 'react';

/**
 * Re-evaluates auto-time theme every minute. Mounts at the root so it runs
 * everywhere in the authenticated app.
 */
function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function parseTime(s: string | null, fallback: number): number {
  if (!s) return fallback;
  const [h, m] = s.split(':').map((n) => parseInt(n, 10));
  if (isNaN(h)) return fallback;
  return h * 60 + (isNaN(m) ? 0 : m);
}

let lastApplied: boolean | null = null;

function evaluate() {
  if (typeof window === 'undefined') return;
  const mode = localStorage.getItem('theme');
  if (mode !== 'auto-time') return;
  const sunrise = parseTime(localStorage.getItem('theme-sunrise'), 6 * 60);
  const sunset = parseTime(localStorage.getItem('theme-sunset'), 19 * 60 + 30);
  const minutes = nowMinutes();
  const dark = minutes >= sunset || minutes < sunrise;
  const isCurrentlyDark = document.documentElement.classList.contains('dark');
  if (dark === isCurrentlyDark) return; // no flip needed

  // Only animate when this is an actual day/night crossover, not a no-op.
  if (lastApplied !== null) {
    document.documentElement.classList.add('theme-fading');
    window.setTimeout(() => {
      document.documentElement.classList.remove('theme-fading');
    }, 2700);
  }
  document.documentElement.classList.toggle('dark', dark);
  lastApplied = dark;
}

export function ThemeAutoTick() {
  useEffect(() => {
    evaluate();
    const tick = window.setInterval(evaluate, 60_000);
    return () => window.clearInterval(tick);
  }, []);
  return null;
}
