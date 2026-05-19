'use client';

import { useEffect, useRef } from 'react';

const SOUND_URL = '/sounds/notify.mp3';
const SEEN_KEY = 'notify-last-seen';
const ENABLED_KEY = 'notify-sound-enabled';

export function NotifySound({ unread }: { unread: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const armedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    audioRef.current = new Audio(SOUND_URL);
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 0.6;

    const enabled = localStorage.getItem(ENABLED_KEY);
    if (enabled === null) localStorage.setItem(ENABLED_KEY, 'true');

    // First mount sets the baseline silently so we don't ping on initial page load.
    const lastSeen = Number(localStorage.getItem(SEEN_KEY) ?? '0');
    if (unread > lastSeen) {
      localStorage.setItem(SEEN_KEY, String(unread));
    } else {
      localStorage.setItem(SEEN_KEY, String(unread));
    }
    armedRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!armedRef.current) return;
    const lastSeen = Number(localStorage.getItem(SEEN_KEY) ?? '0');
    const enabled = localStorage.getItem(ENABLED_KEY) !== 'false';
    if (enabled && unread > lastSeen && audioRef.current) {
      const el = audioRef.current.cloneNode(true) as HTMLAudioElement;
      el.volume = 0.6;
      el.play().catch(() => {
        // Browsers block autoplay until first user interaction. Silently ignore.
      });
    }
    localStorage.setItem(SEEN_KEY, String(unread));
  }, [unread]);

  return null;
}
