// FairPlan auth — PBKDF2 password hashing + HMAC-signed session cookies.
// Pure Web Crypto, runs in Workers without any external dependency.

import { logAudit } from './db';

export const COOKIE_NAME = 'fp_session';

export function requireRole(
  user: SessionUser | null,
  allowed: Role[],
): { ok: true; user: SessionUser } | { ok: false; redirect: string } {
  if (!user) return { ok: false, redirect: '/login' };
  if (!allowed.includes(user.role)) return { ok: false, redirect: '/' };
  return { ok: true, user };
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const PBKDF2_ITERATIONS = 100_000;

const DEMO_PASSWORD = 'fairplan2026';
export const DEMO_USERS = [
  { id: 'usr_resident_demo', email: 'resident@brampton.demo', name: 'Priya Sandhu', role: 'resident' as const },
  { id: 'usr_officer_demo', email: 'officer@brampton.demo', name: 'Devon Wright', role: 'officer' as const },
  { id: 'usr_manager_demo', email: 'manager@brampton.demo', name: 'Aisha Khan', role: 'manager' as const },
];

export type Role = 'resident' | 'officer' | 'manager';

export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: Role;
  created_at: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// ─── password hashing ────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [scheme, iterStr, saltHex, hashHex] = encoded.split('$');
  if (scheme !== 'pbkdf2' || !iterStr || !saltHex || !hashHex) return false;
  const salt = fromHex(saltHex);
  const expected = fromHex(hashHex);
  const actual = await pbkdf2(password, salt, parseInt(iterStr, 10));
  return timingSafeEqual(expected, new Uint8Array(actual));
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    key,
    256,
  );
}

// ─── session cookie ──────────────────────────────────────────────────────────

interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  exp: number;
}

export async function signSession(env: Env, user: SessionUser): Promise<string> {
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(env, body);
  return `${body}.${sig}`;
}

export async function verifySession(env: Env, token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = await hmac(env, body);
  if (!timingSafeEqualString(sig, expected)) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

async function hmac(env: Env, body: string): Promise<string> {
  const secret = env.AUTH_SECRET ?? 'fairplan-dev-secret-do-not-use-in-production';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return b64url(new Uint8Array(sig));
}

export function buildCookie(value: string, prod: boolean): string {
  const attrs = [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (prod) attrs.push('Secure');
  return attrs.join('; ');
}

export function clearCookie(prod: boolean): string {
  const attrs = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (prod) attrs.push('Secure');
  return attrs.join('; ');
}

export function readCookie(req: Request): string | undefined {
  const raw = req.headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === COOKIE_NAME) return v;
  }
  return undefined;
}

// ─── user repository ─────────────────────────────────────────────────────────

export async function findUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return await db
    .prepare('SELECT * FROM users WHERE email = ?1 LIMIT 1')
    .bind(email.toLowerCase())
    .first<UserRow>();
}

export async function createUser(
  db: D1Database,
  args: { email: string; name: string; password: string; role?: Role },
): Promise<SessionUser> {
  const email = args.email.toLowerCase().trim();
  const existing = await findUserByEmail(db, email);
  if (existing) throw new Error('An account with this email already exists.');
  const id = `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const password_hash = await hashPassword(args.password);
  const role: Role = args.role ?? 'resident';
  await db
    .prepare('INSERT INTO users (id, email, name, password_hash, role) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(id, email, args.name.trim(), password_hash, role)
    .run();
  await logAudit(db, { actor: `user:${id}`, action: 'signup', details: { email, role } });
  return { id, email, name: args.name.trim(), role };
}

/**
 * Idempotently create the three demo users with the right PBKDF2 hash.
 * Called on first /api/auth/login attempt so reviewers can sign in without
 * running any seed script.
 */
export async function seedDemoUsersIfNeeded(db: D1Database): Promise<void> {
  const existing = await db.prepare('SELECT id FROM users LIMIT 1').first();
  if (existing) return;
  for (const u of DEMO_USERS) {
    const hash = await hashPassword(DEMO_PASSWORD);
    await db
      .prepare(
        'INSERT OR IGNORE INTO users (id, email, name, password_hash, role) VALUES (?1, ?2, ?3, ?4, ?5)',
      )
      .bind(u.id, u.email, u.name, hash, u.role)
      .run();
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const a = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let acc = 0;
  for (let i = 0; i < a.length; i++) acc |= a[i] ^ b[i];
  return acc === 0;
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let acc = 0;
  for (let i = 0; i < a.length; i++) acc |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return acc === 0;
}
