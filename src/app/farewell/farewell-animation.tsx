'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './farewell.module.css';

const BRAND = 'ELEVATEOCO';
const LINES = ['Signing you out...', 'Saving your spot.', 'Take care.'];

export function FarewellAnimation({ name }: { name: string }) {
  const router = useRouter();
  const [lineIndex, setLineIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio('/sounds/descender.mp3');
    audio.volume = 0.5;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      audio.play().catch(() => {
        startedRef.current = false;
      });
    };

    start();
    const onPointer = () => start();
    const onKey = () => start();
    window.addEventListener('pointerdown', onPointer, { once: true });
    window.addEventListener('keydown', onKey, { once: true });

    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    const cycle = window.setInterval(() => {
      setFading(true);
      window.setTimeout(() => {
        setLineIndex((i) => (i + 1) % LINES.length);
        setFading(false);
      }, 250);
    }, 1100);

    const navigate = window.setTimeout(() => {
      router.push('/login');
    }, 4200);

    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(navigate);
    };
  }, [router]);

  const chars = [...BRAND];
  return (
    <div className={styles.root}>
      <div className={styles.aurora} />
      <main className={styles.stage}>
        <svg className={styles.mark} viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="farewellMarkGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9ec5ff" />
              <stop offset="100%" stopColor="#c89eff" />
            </linearGradient>
          </defs>
          <circle className={styles.ring} cx="32" cy="32" r="26" />
          <circle className={styles.dot} cx="32" cy="32" r="4" />
        </svg>

        <h1 className={styles.brand} aria-label={BRAND}>
          {chars.map((c, i) => (
            <span
              key={i}
              className={styles.ch}
              style={{ animationDelay: `${200 + (chars.length - 1 - i) * 60}ms` }}
            >
              {c}
            </span>
          ))}
        </h1>

        <div className={styles.underline} />

        <div className={styles.farewell}>
          See you soon{name ? `, ${name}` : ''}.
        </div>
        <div className={styles.sub} style={{ opacity: fading ? 0 : undefined }}>
          {LINES[lineIndex]}
        </div>
      </main>
      <div className={styles.blackout} />
    </div>
  );
}
