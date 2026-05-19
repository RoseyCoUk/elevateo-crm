'use client';

import { useEffect, useRef } from 'react';

const SEEN_KEY = 'notify-last-seen';
const ENABLED_KEY = 'notify-sound-enabled';

// Map each notification type to one of the Big Sur sounds in /public/sounds/.
// Mappings the user picked by ear:
//   sound-1 → default ping (mail/announcement)
//   sound-2 → task_rejected (rejected approval return)
//   sound-3 → task_approved (positively approved)
//   sound-4 → task_assigned (new task assigned)
//   sound-10 → log off (handled separately)
// The remaining types use sensible siblings.
const SOUND_BY_TYPE: Record<string, string> = {
  task_assigned: '/sounds/sound-4.mp3',
  task_mentioned: '/sounds/sound-7.mp3',
  task_review_requested: '/sounds/sound-5.mp3',
  task_approved: '/sounds/sound-3.mp3',
  task_rejected: '/sounds/sound-2.mp3',
  comment_reply: '/sounds/sound-6.mp3',
  project_assigned: '/sounds/sound-4.mp3',
  approval_pending: '/sounds/sound-5.mp3',
  announcement: '/sounds/sound-1.mp3',
};
const DEFAULT_SOUND = '/sounds/notify.mp3';

export function NotifySound({
  unread,
  latestType,
}: {
  unread: number;
  latestType: string | null;
}) {
  const armedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(ENABLED_KEY) === null) {
      localStorage.setItem(ENABLED_KEY, 'true');
    }
    // Seed baseline silently on first mount so we don't ping for whatever was already unread.
    localStorage.setItem(SEEN_KEY, String(unread));
    armedRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!armedRef.current) return;
    const lastSeen = Number(localStorage.getItem(SEEN_KEY) ?? '0');
    const enabled = localStorage.getItem(ENABLED_KEY) !== 'false';
    if (enabled && unread > lastSeen) {
      const src = (latestType && SOUND_BY_TYPE[latestType]) || DEFAULT_SOUND;
      const el = new Audio(src);
      el.volume = 0.6;
      el.play().catch(() => {
        // Browsers block autoplay until first user interaction. Silently ignore.
      });
    }
    localStorage.setItem(SEEN_KEY, String(unread));
  }, [unread, latestType]);

  return null;
}
