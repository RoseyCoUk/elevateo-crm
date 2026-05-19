'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { updateProfile } from './actions';
import type { User } from '@/lib/supabase/types';

const SKIN_TONES: { value: string; label: string; hex: string }[] = [
  { value: 'porcelain', label: 'Porcelain', hex: '#ffe6d5' },
  { value: 'ivory', label: 'Ivory', hex: '#fbd3b2' },
  { value: 'beige', label: 'Beige', hex: '#f0bf95' },
  { value: 'almond', label: 'Almond', hex: '#dca579' },
  { value: 'honey', label: 'Honey', hex: '#c08a5d' },
  { value: 'caramel', label: 'Caramel', hex: '#9b6a40' },
  { value: 'cocoa', label: 'Cocoa', hex: '#704a2c' },
  { value: 'espresso', label: 'Espresso', hex: '#3f2918' },
  { value: 'yerrow', label: 'Yerrow', hex: '#ffd54a' },
];

const AVATAR_MAX_SIDE = 192;
const AVATAR_QUALITY = 0.78;

async function fileToResizedDataUrl(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not read image.'));
      i.src = url;
    });

    const scale = Math.min(1, AVATAR_MAX_SIDE / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported.');
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', AVATAR_QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ProfileForm({ profile }: { profile: User & { skin_tone?: string | null } }) {
  const [pending, setPending] = useState(false);
  const [avatar, setAvatar] = useState<string>(profile.avatar_url ?? '');
  const [skinTone, setSkinTone] = useState<string>(profile.skin_tone ?? '');
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Pick an image file.');
      return;
    }
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setAvatar(dataUrl);
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not load image.');
    }
  }

  async function onSubmit(formData: FormData) {
    formData.set('avatar_url', avatar);
    formData.set('skin_tone', skinTone);
    setPending(true);
    try {
      const r = await updateProfile(formData);
      if (r?.error) toast.error(r.error);
      else toast.success('Saved');
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Profile picture</Label>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-[var(--color-surface-3)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-dim)] text-xs">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              'No image'
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" /> Upload
              </Button>
              {avatar ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setAvatar('')}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </Button>
              ) : null}
            </div>
            <p className="text-[11px] text-[var(--color-fg-dim)]">
              Image is resized to {AVATAR_MAX_SIDE}px and stored inline. No external storage.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" defaultValue={profile.full_name} required />
      </div>

      <div className="space-y-2">
        <Label>Colour of skin</Label>
        <div className="flex flex-wrap gap-1.5">
          {SKIN_TONES.map((tone) => (
            <button
              key={tone.value}
              type="button"
              title={tone.label}
              onClick={() => setSkinTone(skinTone === tone.value ? '' : tone.value)}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition',
                skinTone === tone.value
                  ? 'border-[var(--color-fg)] scale-110 shadow-md'
                  : 'border-transparent hover:border-[var(--color-border)]',
              )}
              style={{ background: tone.hex }}
              aria-label={tone.label}
            />
          ))}
        </div>
        {skinTone ? (
          <p className="text-[11px] text-[var(--color-fg-dim)] capitalize">{skinTone}</p>
        ) : (
          <p className="text-[11px] text-[var(--color-fg-dim)]">No preference</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cold_call_goal">Cold call goal · daily</Label>
        <Input
          id="cold_call_goal"
          name="cold_call_goal"
          type="number"
          min={0}
          max={500}
          defaultValue={profile.cold_call_goal ?? 40}
          required
        />
      </div>

      <Button disabled={pending}>{pending ? 'Saving...' : 'Save'}</Button>
    </form>
  );
}
