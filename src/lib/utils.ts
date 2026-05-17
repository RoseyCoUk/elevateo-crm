import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function relativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  const diff = Math.round((ts - Date.now()) / 1000);
  const abs = Math.abs(diff);
  if (abs < 60) return diff <= 0 ? 'just now' : 'in a moment';
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [86400 * 7, 'day'],
    [86400 * 30, 'week'],
    [86400 * 365, 'month'],
    [Infinity, 'year'],
  ];
  let value = diff;
  let unit: Intl.RelativeTimeFormatUnit = 'second';
  for (let i = 0; i < units.length; i++) {
    if (abs < units[i][0]) {
      const divisor = i === 0 ? 1 : units[i - 1][0];
      value = Math.round(diff / divisor);
      unit = units[i][1];
      break;
    }
  }
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(value, unit);
}

export function formatDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', opts ?? { day: '2-digit', month: 'short' });
}
