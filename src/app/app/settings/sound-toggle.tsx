'use client';

import { useEffect, useState } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ENABLED_KEY = 'notify-sound-enabled';

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const v = localStorage.getItem(ENABLED_KEY);
    setEnabled(v !== 'false');
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(ENABLED_KEY, String(next));
  }

  function preview() {
    const a = new Audio('/sounds/notify.mp3');
    a.volume = 0.6;
    a.play().catch(() => {});
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] transition',
          enabled
            ? 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)]'
            : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]',
        )}
      >
        {enabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        {enabled ? 'On' : 'Off'}
      </button>
      <Button type="button" variant="ghost" size="sm" onClick={preview}>
        <Play className="h-3.5 w-3.5" /> Preview
      </Button>
    </div>
  );
}
