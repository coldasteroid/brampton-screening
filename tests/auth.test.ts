import { describe, expect, test } from 'vitest';
import { hashPassword, verifyPassword } from '~/lib/auth';

describe('auth · PBKDF2 password hashing', () => {
  test('hashes are well-formed', async () => {
    const hash = await hashPassword('fairplan2026');
    expect(hash).toMatch(/^pbkdf2\$\d+\$[0-9a-f]+\$[0-9a-f]+$/);
  });

  test('verify accepts the correct password', async () => {
    const hash = await hashPassword('s3cret-passw0rd');
    expect(await verifyPassword('s3cret-passw0rd', hash)).toBe(true);
  });

  test('verify rejects the wrong password', async () => {
    const hash = await hashPassword('correct-horse');
    expect(await verifyPassword('battery-staple', hash)).toBe(false);
  });

  test('verify returns false for malformed input rather than throwing', async () => {
    expect(await verifyPassword('anything', 'not-a-valid-hash')).toBe(false);
    expect(await verifyPassword('anything', 'pbkdf2$invalid')).toBe(false);
  });

  test('two hashes of the same password differ (per-user salt)', async () => {
    const a = await hashPassword('same-password');
    const b = await hashPassword('same-password');
    expect(a).not.toBe(b);
    expect(await verifyPassword('same-password', a)).toBe(true);
    expect(await verifyPassword('same-password', b)).toBe(true);
  });
});
