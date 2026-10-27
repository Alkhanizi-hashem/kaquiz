import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createDatabase } from '../src/database.js';

const instances: Array<ReturnType<typeof createApp>> = [];

afterEach(() => {
  while (instances.length > 0) instances.pop()!.close();
});

function setup(options: {
  now?: () => Date;
  authRateLimit?: { windowMs: number; limit: number };
} = {}) {
  const instance = createApp({
    databasePath: ':memory:',
    jwtSecret: 'test-secret-that-is-at-least-thirty-two-bytes',
    corsOrigin: 'http://localhost:8081',
    ...options,
  });
  instances.push(instance);
  return instance;
}

interface AuditUser {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
}

async function register(app: ReturnType<typeof createApp>['app'], key: string) {
  const response = await request(app).post('/api/auth/register').send({
    name: key[0]!.toUpperCase() + key.slice(1),
    email: ` ${key}@Example.COM `,
    password: `password-${key}-1`,
  }).expect(200);
  assert.equal(typeof response.body.access_token, 'string');
  return {
    token: response.body.access_token as string,
    user: response.body.user as AuditUser,
  };
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('local email and password authentication', () => {
  test('loads only local configuration with documented defaults', () => {
    assert.deepEqual(loadConfig({
      JWT_SECRET: 'test-secret-that-is-at-least-thirty-two-bytes',
    }), {
      JWT_SECRET: 'test-secret-that-is-at-least-thirty-two-bytes',
      PORT: 3000,
      DATABASE_PATH: './kaquiz.sqlite',
      CORS_ORIGIN: 'http://localhost:8081',
    });
  });

  test('registers immediately with normalized email and logs in', async () => {
    const { app } = setup();
    const alice = await register(app, 'alice');
    assert.deepEqual(alice.user, {
      id: 1,
      email: 'alice@example.com',
      name: 'Alice',
      avatar: null,
    });
    await request(app).get('/api/users/me').set(auth(alice.token)).expect(200, alice.user);

    const login = await request(app).post('/api/auth/login').send({
      email: 'ALICE@EXAMPLE.COM',
      password: 'password-alice-1',
    }).expect(200);
    assert.deepEqual(login.body.user, alice.user);
    assert.equal(typeof login.body.access_token, 'string');
  });

  test('rejects duplicate normalized email with 409', async () => {
    const { app } = setup();
    await register(app, 'alice');
    const duplicate = await request(app).post('/api/auth/register').send({
      name: 'Other Alice',
      email: 'ALICE@example.com',
      password: 'another-password-2',
    }).expect(409);
    assert.equal(duplicate.body.error.code, 'EMAIL_ALREADY_REGISTERED');
  });

  test('enforces the 12-128 character letter-and-digit password policy', async () => {
    const { app } = setup();
    const invalidPasswords = [
      'short1',
      'onlyletterslong',
      '123456789012',
      `${'a'.repeat(128)}1`,
    ];
    for (const [index, password] of invalidPasswords.entries()) {
      await request(app).post('/api/auth/register').send({
        name: 'Invalid',
        email: `invalid-${index}@example.com`,
        password,
      }).expect(400);
    }
    await request(app).post('/api/auth/register').send({
      name: 'Boundary',
      email: 'boundary@example.com',
      password: `${'a'.repeat(127)}1`,
    }).expect(200);
  });

  test('uses generic login errors and rate limits authentication attempts', async () => {
    const { app } = setup({ authRateLimit: { windowMs: 60_000, limit: 3 } });
    await register(app, 'alice');
    const first = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com', password: 'wrong-password-1',
    }).expect(401);
    const second = await request(app).post('/api/auth/login').send({
      email: 'missing@example.com', password: 'wrong-password-1',
    }).expect(401);
    assert.deepEqual(second.body, first.body);
    const limited = await request(app).post('/api/auth/login').send({
      email: 'third@example.com', password: 'wrong-password-1',
    }).expect(429);
    assert.equal(limited.body.error.code, 'RATE_LIMITED');
  });

  test('creates the fresh local password schema', async () => {
    const database = createDatabase(':memory:');
    try {
      const columns = database.prepare('PRAGMA table_info(users)').all() as unknown as Array<{ name: string }>;
      assert.deepEqual(columns.map(({ name }) => name), [
        'id', 'email', 'password_hash', 'name', 'avatar', 'created_at', 'updated_at', 'password_enabled',
      ]);
    } finally {
      database.close();
    }

    const { app } = setup();
    const first = await register(app, 'alice');
    const second = await register(app, 'bob');
    assert.notEqual(first.token, second.token);
  });

  test('logout revokes only the presented session', async () => {
    const { app } = setup();
    const alice = await register(app, 'alice');
    const login = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com', password: 'password-alice-1',
    }).expect(200);
    await request(app).post('/api/auth/logout').set(auth(alice.token)).expect(200);
    await request(app).get('/api/users/me').set(auth(alice.token)).expect(401);
    await request(app).get('/api/users/me').set(auth(login.body.access_token)).expect(200, alice.user);
    await request(app).get('/api/users/me').set(auth('not-a-jwt')).expect(401);
  });
});

describe('users, invites, friends, and locations', () => {
  test('updates the authenticated user and searches by exact normalized email only', async () => {
    const { app } = setup();
    const alice = await register(app, 'alice');
    const bob = await register(app, 'bob');
    const updated = await request(app).put('/api/users').set(auth(alice.token))
      .send({ name: 'Alice A.', avatar: 'https://example.com/new.png' }).expect(200);
    assert.deepEqual(updated.body, {
      id: alice.user.id, name: 'Alice A.', avatar: 'https://example.com/new.png', email: 'alice@example.com',
    });
    const found = await request(app).get('/api/users/search?email=%20BOB%40example.com%20')
      .set(auth(alice.token)).expect(200);
    assert.equal(found.body.id, bob.user.id);
    assert.equal(found.body.relationship, 'none');
    await request(app).get('/api/users/search?email=bo%40example.com').set(auth(alice.token)).expect(404);
    await request(app).get('/api/users/search?email=alice%40example.com').set(auth(alice.token)).expect(404);
    await request(app).get('/api/users/search?email=bob%40example.com').expect(401);
  });

  test('enforces invite ownership and supports decline', async () => {
    const { app } = setup();
    const alice = await register(app, 'alice');
    const bob = await register(app, 'bob');
    await request(app).post(`/api/invites/${alice.user.id}`).set(auth(alice.token)).expect(409);
    await request(app).post(`/api/invites/${bob.user.id}`).set(auth(alice.token)).expect(200);
    await request(app).post(`/api/invites/${alice.user.id}`).set(auth(bob.token)).expect(409);
    await request(app).get(`/api/invites/${alice.user.id}`).set(auth(bob.token)).expect(403);
    const incoming = await request(app).get(`/api/invites/${bob.user.id}`).set(auth(bob.token)).expect(200);
    assert.equal(incoming.body.incoming[0].sender.id, alice.user.id);
    await request(app).post(`/api/invites/${alice.user.id}/decline`).set(auth(bob.token)).expect(200);
    await request(app).post(`/api/invites/${alice.user.id}/decline`).set(auth(bob.token)).expect(404);
    const empty = await request(app).get(`/api/invites/${bob.user.id}`).set(auth(bob.token)).expect(200);
    assert.deepEqual(empty.body, { incoming: [], outgoing: [] });
  });

  test('shows only friends the latest five-second location update and keeps accuracy internal', async () => {
    let clock = new Date('2026-08-10T10:00:00.000Z');
    const { app } = setup({ now: () => clock });
    const alice = await register(app, 'alice');
    const bob = await register(app, 'bob');

    const firstLocation = await request(app).post('/api/locations').set(auth(bob.token))
      .send({ latitude: 10.25, longitude: 20.5, accuracy: 4 }).expect(200);
    assert.deepEqual(firstLocation.body, {
      latitude: 10.25, longitude: 20.5, timestamp: '2026-08-10T10:00:00.000Z',
    });
    assert.deepEqual((await request(app).get('/api/friends').set(auth(alice.token)).expect(200)).body, []);

    clock = new Date('2026-08-10T10:00:05.000Z');
    await request(app).post('/api/locations').set(auth(bob.token))
      .send({ latitude: 11.5, longitude: 21.75, accuracy: 2 }).expect(200);
    await request(app).post(`/api/invites/${bob.user.id}`).set(auth(alice.token)).expect(200);
    await request(app).post(`/api/invites/${alice.user.id}/accept`).set(auth(bob.token)).expect(200);

    const friends = await request(app).get('/api/friends').set(auth(alice.token)).expect(200);
    assert.deepEqual(friends.body, [{
      id: bob.user.id,
      name: 'Bob',
      avatar: null,
      location: {
        latitude: '11.5',
        longitude: '21.75',
        timestamp: '2026-08-10T10:00:05.000Z',
      },
    }]);

    const relationship = await request(app).get('/api/users/search?email=bob%40example.com')
      .set(auth(alice.token)).expect(200);
    assert.equal(relationship.body.relationship, 'friends');
    await request(app).delete(`/api/friends/${bob.user.id}`).set(auth(alice.token)).expect(200);
    await request(app).delete(`/api/friends/${bob.user.id}`).set(auth(alice.token)).expect(404);
    assert.deepEqual((await request(app).get('/api/friends').set(auth(alice.token)).expect(200)).body, []);
  });
});
