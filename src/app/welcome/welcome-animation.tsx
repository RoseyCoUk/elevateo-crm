'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './welcome.module.css';

const BRAND = 'ELEVATEOCO';

export function WelcomeAnimation({ next }: { next: string }) {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio('/sounds/riser.mp3');
    audio.volume = 0.5;
    audioRef.current = audio;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      audio.play().catch(() => {
        // Autoplay blocked — let the unlock listeners try again.
        startedRef.current = false;
      });
    };

    const lead = window.setTimeout(start, 200);
    const onPointer = () => start();
    const onKey = () => start();
    window.addEventListener('pointerdown', onPointer, { once: true });
    window.addEventListener('keydown', onKey, { once: true });

    return () => {
      window.clearTimeout(lead);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      stage.style.transform = `rotateY(${x * 0.3}deg) rotateX(${-y * 0.3}deg) translateZ(0)`;
    };
    const onLeave = () => {
      stage.style.transform = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  function onContinue() {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(() => {
      router.push(next || '/app');
    }, 950);
  }

  return (
    <div className={`${styles.root} ${exiting ? styles.exiting : ''}`}>
      <div className={styles.aurora} />
      <div className={styles.stars}>
        {Array.from({ length: 40 }, (_, i) => (
          <span
            key={i}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <main ref={stageRef} className={styles.stage}>
        <svg className={styles.mark} viewBox="0 0 84 84" aria-hidden="true">
          <defs>
            <linearGradient id="welcomeMarkGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9ec5ff" />
              <stop offset="100%" stopColor="#c89eff" />
            </linearGradient>
          </defs>
          <circle className={styles.ring} cx="42" cy="42" r="35" />
          <circle className={styles.pulse} cx="42" cy="42" r="6" />
        </svg>

        <h1 className={styles.brand} aria-label={BRAND}>
          {[...BRAND].map((c, i) => (
            <span
              key={i}
              className={styles.ch}
              style={{ animationDelay: `${300 + i * 60}ms` }}
            >
              {c}
            </span>
          ))}
        </h1>

        <div className={styles.underline} />
        <p className={styles.welcome}>Welcome back</p>

        <button
          type="button"
          className={styles.cta}
          aria-label="Continue"
          onClick={onContinue}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
        <small className={styles.hint}>Click to enter</small>
      </main>

      <div className={styles.blackout} />
    </div>
  );
}
