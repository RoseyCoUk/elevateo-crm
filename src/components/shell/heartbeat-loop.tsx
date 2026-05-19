'use client';

import { useEffect } from 'react';
import { heartbeat } from '@/app/app/presence-actions';

const TICK_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Fires a heartbeat to bump last_seen_at while the tab is visible.
 * Threshold for 'away' is 15 minutes, so 2-minute granularity is plenty.
 */
export function HeartbeatLoop() {
  useEffect(() => {
    let cancelled = false;
    const fire = () => {
      if (cancelled) return;
      heartbeat().catch(() => {});
    };
    fire();
    const tick = window.setInterval(() => {
      if (document.visibilityState === 'visible') fire();
    }, TICK_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') fire();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => {
      cancelled = true;
      window.clearInterval(tick);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    };
  }, []);
  return null;
}
