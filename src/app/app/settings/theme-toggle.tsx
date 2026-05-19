'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Sun, Moon, Monitor, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { computeSunTimes } from '@/lib/sun-times';

type Theme = 'light' | 'dark' | 'system' | 'auto-time';

const DEFAULT_SUNRISE = '06:00';
const DEFAULT_SUNSET = '19:30';
const DEFAULT_ISHA = '21:00';

function parseTime(s: string | null, fallback: string): number {
  const v = (s ?? fallback).trim();
  const [h, m] = v.split(':').map((n) => parseInt(n, 10));
  return ((isNaN(h) ? 0 : h) * 60) + (isNaN(m) ? 0 : m);
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function isDarkForAutoTime(): boolean {
  if (typeof window === 'undefined') return false;
  const sunrise = parseTime(localStorage.getItem('theme-sunrise'), DEFAULT_SUNRISE);
  const sunset = parseTime(localStorage.getItem('theme-sunset'), DEFAULT_SUNSET);
  const minutes = nowMinutes();
  return minutes >= sunset || minutes < sunrise;
}

export function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let dark: boolean;
  if (theme === 'auto-time') dark = isDarkForAutoTime();
  else dark = theme === 'dark' || (theme === 'system' && sysDark);
  document.documentElement.classList.toggle('dark', dark);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [sunrise, setSunrise] = useState(DEFAULT_SUNRISE);
  const [sunset, setSunset] = useState(DEFAULT_SUNSET);
  const [isha, setIsha] = useState(DEFAULT_ISHA);

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme | null) ?? 'system';
    setTheme(saved);
    setSunrise(localStorage.getItem('theme-sunrise') ?? DEFAULT_SUNRISE);
    setSunset(localStorage.getItem('theme-sunset') ?? DEFAULT_SUNSET);
    setIsha(localStorage.getItem('theme-isha') ?? DEFAULT_ISHA);
  }, []);

  function pick(t: Theme) {
    setTheme(t);
    localStorage.setItem('theme', t);
    applyTheme(t);
  }

  function saveTime(key: 'theme-sunrise' | 'theme-sunset' | 'theme-isha', value: string) {
    if (key === 'theme-sunrise') setSunrise(value);
    if (key === 'theme-sunset') setSunset(value);
    if (key === 'theme-isha') setIsha(value);
    localStorage.setItem(key, value);
    if (theme === 'auto-time') applyTheme('auto-time');
  }

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'auto-time', label: 'Auto', icon: Clock },
  ];

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5">
        {options.map((o) => {
          const active = theme === o.value;
          const Icon = o.icon;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => pick(o.value)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition',
                active
                  ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-sm'
                  : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {o.label}
            </button>
          );
        })}
      </div>
      {theme === 'auto-time' ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 max-w-md">
            <TimeInput label="Sunrise" value={sunrise} onChange={(v) => saveTime('theme-sunrise', v)} />
            <TimeInput label="Sunset" value={sunset} onChange={(v) => saveTime('theme-sunset', v)} />
            <TimeInput label="Isha (full dark)" value={isha} onChange={(v) => saveTime('theme-isha', v)} />
          </div>
          <button
            type="button"
            onClick={() => detectFromLocation((times) => {
              saveTime('theme-sunrise', times.sunrise);
              saveTime('theme-sunset', times.sunset);
              saveTime('theme-isha', times.isha);
            })}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-1 text-[12px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition"
          >
            <MapPin className="h-3.5 w-3.5" />
            Detect from my location
          </button>
        </div>
      ) : null}
    </div>
  );
}

function detectFromLocation(onDone: (t: { sunrise: string; sunset: string; isha: string }) => void) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    toast.error('Geolocation not available in this browser.');
    return;
  }
  toast.loading('Getting your location...', { id: 'geo' });
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const times = computeSunTimes(new Date(), latitude, longitude);
      if (!times) {
        toast.error('Polar day/night at your latitude — set times manually.', { id: 'geo' });
        return;
      }
      try {
        localStorage.setItem('theme-location', JSON.stringify({ lat: latitude, lon: longitude }));
      } catch {}
      onDone(times);
      toast.success(`Set: sunrise ${times.sunrise}, sunset ${times.sunset}, isha ${times.isha}`, { id: 'geo' });
    },
    (err) => {
      toast.error(err.message || 'Could not read location.', { id: 'geo' });
    },
    { enableHighAccuracy: false, timeout: 8000 },
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)]">
        {label}
      </span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[13px]"
      />
    </label>
  );
}
