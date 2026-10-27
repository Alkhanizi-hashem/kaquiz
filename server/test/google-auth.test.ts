import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, before, describe, test } from 'node:test';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTPayload } from 'jose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDatabase } from '../src/database.js';
import { createGoogleVerifier } from '../src/google-auth.js';
import { hashPassword } from '../src/password.js';

const clientId = 'test-web.apps.googleusercontent.com';
const instances: Array<ReturnType<typeof createApp>> = [];
const directories: string[] = [];
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
let verifier: ReturnType<typeof createGoogleVerifier>;
before(async () => {
  keys = await generateKeyPair('RS256');
  verifier = createGoogleVerifier(clientId, createLocalJWKSet({ keys: [{ ...await exportJWK(keys.publicKey), kid: 'test', alg: 'RS256' }] }));
});
afterEach(() => {
  while (instances.length) instances.pop()!.close();
  while (directories.length) rmSync(directories.pop()!, { recursive: true, force: true });
});
function setup(enabled = true, databasePath = ':memory:') {
  const instance = createApp({ databasePath, jwtSecret: 'test-google-secret-at-least-thirty-two-characters', ...(enabled ? { googleVerifier: verifier } : {}) });
  instances.push(instance);
  return instance.app;
}
function claims(overrides: JWTPayload = {}): JWTPayload {
  const now = Math.floor(Date.now() / 1000);
  return { iss: 'https://accounts.google.com', aud: clientId, sub: 'google-1', iat: now, exp: now + 3600, email: 'Google@Example.com', email_verified: true, name: 'Google User', ...overrides };
}
async function token(overrides: JWTPayload = {}) {
  return new SignJWT(claims(overrides)).setProtectedHeader({ alg: 'RS256', kid: 'test' }).sign(keys.privateKey);
}
const bearer = (value: string) => ({ Authorization: `Bearer ${value}` });

describe('Google signature and claim validation', () => {
  test('accepts signed identity and both documented issuers', async () => {
    assert.deepEqual(await verifier(await token()), { subject: 'google-1', email: 'google@example.com', name: 'Google User' });
    assert.equal((await verifier(await token({ iss: 'accounts.google.com' }))).subject, 'google-1');
  });
  for (const [label, overrides] of [
    ['wrong audience', { aud: 'another-app' }], ['wrong issuer', { iss: 'https://attacker.example' }],
    ['expired', { exp: 1 }], ['future issued-at', { iat: Math.floor(Date.now() / 1000) + 3600 }], ['old issued-at', { iat: 1 }], ['unverified email', { email_verified: false }], ['string verified claim', { email_verified: 'true' }],
    ['missing subject', { sub: undefined }], ['missing expiry', { exp: undefined }], ['missing issued-at', { iat: undefined }], ['invalid email', { email: 'bad' }],
  ] as Array<[string, JWTPayload]>) {
    test(`rejects ${label}`, async () => { await assert.rejects(verifier(await token(overrides)), { code: 'INVALID_GOOGLE_TOKEN' }); });
  }
  test('rejects signature from untrusted key', async () => {
    const attacker = await generateKeyPair('RS256');
    const forged = await new SignJWT(claims()).setProtectedHeader({ alg: 'RS256', kid: 'test' }).sign(attacker.privateKey);
    await assert.rejects(verifier(forged), { code: 'INVALID_GOOGLE_TOKEN' });
  });
  test('rejects alternate algorithms and malformed JWTs', async () => {
    const forged = await new SignJWT(claims()).setProtectedHeader({ alg: 'HS256', kid: 'test' }).sign(new TextEncoder().encode('attacker'));
    await assert.rejects(verifier(forged), { code: 'INVALID_GOOGLE_TOKEN' });
    await assert.rejects(verifier('not.a.jwt'), { code: 'INVALID_GOOGLE_TOKEN' });
  });
});

describe('Google API and app sessions', () => {
  test('issues app session, restores user, and revokes logout', async () => {
    const app = setup();
    const response = await request(app).post('/api/auth/google').send({ id_token: await token() }).expect(200);
    assert.equal(response.body.user.email, 'google@example.com');
    assert.equal(typeof response.body.access_token, 'string');
    assert.equal(response.body.user.password_hash, undefined);
    await request(app).get('/api/users/me').set(bearer(response.body.access_token)).expect(200, response.body.user);
    await request(app).post('/api/auth/logout').set(bearer(response.body.access_token)).expect(200);
    await request(app).get('/api/users/me').set(bearer(response.body.access_token)).expect(401);
  });
  test('uses stable subject for repeated sign-in and changed email', async () => {
    const app = setup();
    const first = await request(app).post('/api/auth/google').send({ id_token: await token() }).expect(200);
    for (const email of ['google@example.com', 'changed@example.com']) {
      const repeat = await request(app).post('/api/auth/google').send({ id_token: await token({ email }) }).expect(200);
      assert.equal(repeat.body.user.id, first.body.user.id);
      assert.equal(repeat.body.user.email, first.body.user.email);
    }
  });
  test('concurrent initial sign-ins create only one Google account', async () => {
    const app = setup();
    const id_token = await token();
    const results = await Promise.all(Array.from({ length: 5 }, () => request(app).post('/api/auth/google').send({ id_token }).expect(200)));
    assert.equal(new Set(results.map((result) => result.body.user.id)).size, 1);
  });
  test('never links matching email to password account and retains password login', async () => {
    const app = setup();
    const password = 'existing-password-123';
    const existing = await request(app).post('/api/auth/register').send({ email: 'google@example.com', password, name: 'Original' }).expect(200);
    const conflict = await request(app).post('/api/auth/google').send({ id_token: await token() }).expect(409);
    assert.equal(conflict.body.error.code, 'GOOGLE_ACCOUNT_CONFLICT');
    const login = await request(app).post('/api/auth/login').send({ email: 'google@example.com', password }).expect(200);
    assert.equal(login.body.user.id, existing.body.user.id);
    assert.equal(login.body.user.name, 'Original');
  });
  test('rejects a different Google subject and password signup using an existing email', async () => {
    const app = setup();
    await request(app).post('/api/auth/google').send({ id_token: await token() }).expect(200);
    await request(app).post('/api/auth/google').send({ id_token: await token({ sub: 'different' }) }).expect(409);
    await request(app).post('/api/auth/register').send({ email: 'google@example.com', password: 'password-123456', name: 'Imposter' }).expect(409);
  });
  test('OAuth-only accounts reject blank and arbitrary passwords', async () => {
    const app = setup();
    await request(app).post('/api/auth/google').send({ id_token: await token() }).expect(200);
    for (const password of ['', 'password-123456']) await request(app).post('/api/auth/login').send({ email: 'google@example.com', password }).expect(401);
  });
  test('rejects invalid token and malformed requests', async () => {
    const app = setup();
    const response = await request(app).post('/api/auth/google').send({ id_token: await token({ aud: 'wrong' }) }).expect(401);
    assert.equal(response.body.error.code, 'INVALID_GOOGLE_TOKEN');
    await request(app).post('/api/auth/google').send({ email: 'google@example.com' }).expect(400);
    await request(app).post('/api/auth/google').send({ id_token: 'a'.repeat(16385) }).expect(400);
  });
  test('fails closed when unconfigured while password registration works', async () => {
    const app = setup(false);
    const response = await request(app).post('/api/auth/google').send({ id_token: 'anything' }).expect(503);
    assert.equal(response.body.error.code, 'GOOGLE_NOT_CONFIGURED');
    await request(app).post('/api/auth/register').send({ email: 'password@example.com', password: 'password-123456', name: 'Password' }).expect(200);
  });
});

test('migration preserves legacy hashes and foreign keys and is repeatable', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'kaquiz-google-migration-'));
  directories.push(directory);
  const path = join(directory, 'legacy.sqlite');
  const passwordHash = await hashPassword('legacy-password-123');
  const legacy = new DatabaseSync(path, { enableForeignKeyConstraints: true });
  legacy.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, name TEXT, avatar TEXT, created_at TEXT NOT NULL DEFAULT 'legacy', updated_at TEXT NOT NULL DEFAULT 'legacy') STRICT;
    CREATE TABLE sessions (jti TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL, revoked_at TEXT, created_at TEXT NOT NULL DEFAULT 'legacy') STRICT;`);
  legacy.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(42, 'legacy@example.com', passwordHash, 'Legacy');
  legacy.prepare('INSERT INTO sessions (jti, user_id, expires_at) VALUES (?, ?, ?)').run('legacy-session', 42, '2099-01-01T00:00:00Z');
  legacy.close();
  for (let attempt = 0; attempt < 2; attempt++) {
    const migrated = createDatabase(path);
    try {
      const user = migrated.prepare('SELECT password_enabled, password_hash FROM users WHERE id = 42').get()!;
      assert.equal(user.password_enabled, 1);
      assert.equal(user.password_hash, passwordHash);
      assert.equal(migrated.prepare('SELECT user_id FROM sessions WHERE jti = ?').get('legacy-session')!.user_id, 42);
      assert.deepEqual(migrated.prepare('PRAGMA foreign_key_check').all(), []);
    } finally { migrated.close(); }
  }
  const app = setup(true, path);
  const result = await request(app).post('/api/auth/login').send({ email: 'legacy@example.com', password: 'legacy-password-123' }).expect(200);
  assert.equal(result.body.user.id, 42);
  await request(app).post('/api/auth/google').send({ id_token: await token() }).expect(200);
});
