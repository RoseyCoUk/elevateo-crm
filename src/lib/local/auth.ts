import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { getStore, saveStore, type LocalUser } from './store';
import { hashPassword, verifyPassword } from './hash';
import { SESSION_COOKIE } from './session-cookie';

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export { SESSION_COOKIE };

export async function readSessionUser(): Promise<LocalUser | null> {
  const jar = await cookies();
  const userId = jar.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  return user ?? null;
}

export async function signInWithPassword(email: string, password: string) {
  const store = getStore();
  const user = store.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) return { error: { message: 'Invalid email or password' } };
  if (!user.password_hash || !verifyPassword(password, user.password_hash)) {
    return { error: { message: 'Invalid email or password' } };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return { error: null, user };
}

export async function signUpUser(
  email: string,
  password: string,
  metadata?: { full_name?: string }
) {
  const store = getStore();
  const lower = email.trim().toLowerCase();
  if (store.users.find((u) => u.email.toLowerCase() === lower)) {
    return { error: { message: 'An account with that email already exists' } };
  }
  if (password.length < 6) {
    return { error: { message: 'Password must be at least 6 characters' } };
  }
  const now = new Date().toISOString();
  const user: LocalUser = {
    id: randomUUID(),
    email: lower,
    full_name: metadata?.full_name?.trim() || email.split('@')[0],
    avatar_url: null,
    cold_call_goal: 40,
    division_id: null,
    divisions: [],
    manager_id: null,
    role: 'member',
    is_active: true,
    created_at: now,
    updated_at: now,
    password_hash: hashPassword(password),
  };
  store.users.push(user);
  saveStore();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return { error: null, user };
}

export async function signOutCurrent() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function hasSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const store = getStore();
  return !!store.users.find((user) => user.id === token);
}
