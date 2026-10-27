import type { DatabaseSync } from 'node:sqlite';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';

import { createTokenService } from './auth.js';
import { createDatabase, transaction } from './database.js';
import { ApiError, errorHandler, notFoundHandler } from './errors.js';
import { createGoogleVerifier, type GoogleVerifier } from './google-auth.js';
import { hashPassword, performDummyPasswordWork, verifyPassword } from './password.js';

interface AppOptions {
  databasePath: string;
  jwtSecret: string;
  corsOrigin?: string;
  googleClientId?: string;
  googleVerifier?: GoogleVerifier;
  now?: () => Date;
  authRateLimit?: { windowMs: number; limit: number };
}

interface UserRow {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
  password_hash?: string | null;
  password_enabled?: number;
}

interface InviteRow {
  id: number;
  created_at: string;
  user_id: number;
  name: string | null;
  avatar: string | null;
}

const idSchema = z.coerce.number().int().positive();
const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));
const passwordSchema = z.string()
  .min(12)
  .max(128)
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one digit');
const registerSchema = z.strictObject({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(100),
});
const loginSchema = z.strictObject({ email: emailSchema, password: z.string().max(128) });
const updateUserSchema = z.strictObject({
  name: z.string().trim().min(1).max(100).optional(),
  avatar: z.url().max(2_048).nullable().optional(),
}).refine((value) => value.name !== undefined || value.avatar !== undefined, 'At least one field is required');
const locationSchema = z.strictObject({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  accuracy: z.number().finite().nonnegative().optional(),
});
const searchSchema = z.strictObject({ email: emailSchema });

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function serializeUser(user: UserRow) {
  return { id: user.id, email: user.email, name: user.name, avatar: user.avatar };
}

function getUser(database: DatabaseSync, userId: number) {
  return database.prepare('SELECT id, email, name, avatar FROM users WHERE id = ?').get(userId) as UserRow | undefined;
}

function pair(first: number, second: number) {
  return first < second ? [first, second] as const : [second, first] as const;
}

function isFriend(database: DatabaseSync, first: number, second: number) {
  const [low, high] = pair(first, second);
  return Boolean(database.prepare('SELECT 1 FROM friendships WHERE user_low_id = ? AND user_high_id = ?').get(low, high));
}

function parseId(value: string) {
  return idSchema.parse(value);
}

function requireUser(database: DatabaseSync, userId: number) {
  const user = getUser(database, userId);
  if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'Authenticated user no longer exists');
  return user;
}

export function createApp(options: AppOptions) {
  if (options.jwtSecret.length < 32) throw new Error('JWT secret must contain at least 32 characters');
  const database = createDatabase(options.databasePath);
  const tokenService = createTokenService(options.jwtSecret, database);
  const verifyGoogle = options.googleVerifier ?? (options.googleClientId ? createGoogleVerifier(options.googleClientId) : null);
  const now = options.now ?? (() => new Date());
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: options.corsOrigin ?? false }));
  app.use(express.json({ limit: '32kb', strict: true }));

  const authLimiter = rateLimit({
    windowMs: options.authRateLimit?.windowMs ?? 15 * 60_000,
    limit: options.authRateLimit?.limit ?? 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, response) => response.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts' },
    }),
  });
  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

  app.post('/api/auth/register', authLimiter, async (request, response) => {
    const input = registerSchema.parse(request.body);
    const existing = database.prepare('SELECT 1 FROM users WHERE email = ?').get(input.email);
    if (existing) throw new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'Email address is already registered');
    const passwordHash = await hashPassword(input.password);
    let userId: number;
    try {
      const result = database.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
        .run(input.email, passwordHash, input.name);
      userId = Number(result.lastInsertRowid);
    } catch (error) {
      if ((error as { code?: string }).code?.startsWith('SQLITE_CONSTRAINT')) {
        throw new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'Email address is already registered');
      }
      throw error;
    }
    const user = getUser(database, userId)!;
    response.json({ access_token: await tokenService.issue(user.id), user: serializeUser(user) });
  });

  app.post('/api/auth/login', authLimiter, async (request, response) => {
    const input = loginSchema.parse(request.body);
    const user = database.prepare('SELECT id, email, name, avatar, password_hash, password_enabled FROM users WHERE email = ?')
      .get(input.email) as UserRow | undefined;
    const valid = user?.password_enabled === 1 && user.password_hash
      ? await verifyPassword(input.password, user.password_hash)
      : (await performDummyPasswordWork(input.password), false);
    if (!user || !valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is invalid');
    response.json({ access_token: await tokenService.issue(user.id), user: serializeUser(user) });
  });

  app.post('/api/auth/google', authLimiter, async (request, response) => {
    if (!verifyGoogle) throw new ApiError(503, 'GOOGLE_NOT_CONFIGURED', 'Google sign-in is not configured on this server');
    const { id_token } = z.strictObject({ id_token: z.string().min(1).max(16_384) }).parse(request.body);
    const identity = await verifyGoogle(id_token);
    const userId = transaction(database, () => {
      const existing = database.prepare('SELECT user_id FROM google_identities WHERE subject = ?')
        .get(identity.subject) as { user_id: number } | undefined;
      if (existing) return existing.user_id;
      // Password sign-up never verified email ownership. Matching email alone
      // MUST NOT grant access to that account or silently attach this identity.
      if (database.prepare('SELECT 1 FROM users WHERE email = ?').get(identity.email)) {
        throw new ApiError(409, 'GOOGLE_ACCOUNT_CONFLICT', 'An account already uses this email. Sign in with its existing method. Google account linking is not available.');
      }
      const result = database.prepare("INSERT INTO users (email, password_hash, password_enabled, name) VALUES (?, '', 0, ?)")
        .run(identity.email, identity.name);
      const id = Number(result.lastInsertRowid);
      database.prepare('INSERT INTO google_identities (subject, user_id) VALUES (?, ?)').run(identity.subject, id);
      return id;
    });
    const user = requireUser(database, userId);
    response.json({ access_token: await tokenService.issue(user.id), user: serializeUser(user) });
  });

  const api = express.Router();
  api.use(['/auth/logout', '/users', '/locations', '/invites', '/friends'], tokenService.authenticate);

  api.post('/auth/logout', (_request, response) => {
    database.prepare(`
      UPDATE sessions
      SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE jti = ? AND user_id = ? AND revoked_at IS NULL
    `).run(response.locals.sessionId as string, response.locals.userId as number);
    response.json({ message: 'Logged out' });
  });

  api.get('/users/me', (_request, response) => {
    response.json(serializeUser(requireUser(database, response.locals.userId as number)));
  });

  api.put('/users', (request, response) => {
    const userId = response.locals.userId as number;
    requireUser(database, userId);
    const update = updateUserSchema.parse(request.body);
    database.prepare(`
      UPDATE users SET
        name = CASE WHEN ? THEN ? ELSE name END,
        avatar = CASE WHEN ? THEN ? ELSE avatar END,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ?
    `).run(update.name !== undefined ? 1 : 0, update.name ?? null, update.avatar !== undefined ? 1 : 0, update.avatar ?? null, userId);
    response.json(serializeUser(getUser(database, userId)!));
  });

  api.get('/users/search', (request, response) => {
    const userId = response.locals.userId as number;
    requireUser(database, userId);
    const { email } = searchSchema.parse(request.query);
    const found = database.prepare('SELECT id, email, name, avatar FROM users WHERE email = ? AND id <> ?').get(email, userId) as UserRow | undefined;
    if (!found) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');

    let relationship = 'none';
    if (isFriend(database, userId, found.id)) relationship = 'friends';
    else if (database.prepare('SELECT 1 FROM invites WHERE sender_id = ? AND recipient_id = ?').get(userId, found.id)) relationship = 'outgoing_pending';
    else if (database.prepare('SELECT 1 FROM invites WHERE sender_id = ? AND recipient_id = ?').get(found.id, userId)) relationship = 'incoming_pending';
    response.json({ ...serializeUser(found), relationship });
  });

  api.post('/locations', (request, response) => {
    const userId = response.locals.userId as number;
    requireUser(database, userId);
    const location = locationSchema.parse(request.body);
    const timestamp = now().toISOString();
    database.prepare(`
      INSERT INTO locations (user_id, latitude, longitude, accuracy, timestamp) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        accuracy = excluded.accuracy,
        timestamp = excluded.timestamp
    `).run(userId, location.latitude, location.longitude, location.accuracy ?? null, timestamp);
    response.json({ latitude: location.latitude, longitude: location.longitude, timestamp });
  });

  api.post('/invites/:user_id', (request, response) => {
    const senderId = response.locals.userId as number;
    requireUser(database, senderId);
    const recipientId = parseId(request.params.user_id);
    if (!getUser(database, recipientId)) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    if (senderId === recipientId) throw new ApiError(409, 'INVITE_CONFLICT', 'You cannot invite yourself');
    if (isFriend(database, senderId, recipientId)) throw new ApiError(409, 'INVITE_CONFLICT', 'Users are already friends');
    if (database.prepare(`
      SELECT 1 FROM invites
      WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
    `).get(senderId, recipientId, recipientId, senderId)) {
      throw new ApiError(409, 'INVITE_CONFLICT', 'A pending invitation already exists');
    }
    const result = database.prepare('INSERT INTO invites (sender_id, recipient_id) VALUES (?, ?)').run(senderId, recipientId);
    response.json({ id: Number(result.lastInsertRowid), message: 'Invitation sent' });
  });

  api.get('/invites/:user_id', (request, response) => {
    const authUserId = response.locals.userId as number;
    requireUser(database, authUserId);
    const userId = parseId(request.params.user_id);
    if (userId !== authUserId) throw new ApiError(403, 'FORBIDDEN', 'Invitations can only be read by their owner');
    const incoming = database.prepare(`
      SELECT i.id, i.created_at, u.id AS user_id, u.name, u.avatar
      FROM invites i JOIN users u ON u.id = i.sender_id
      WHERE i.recipient_id = ? ORDER BY i.created_at, i.id
    `).all(userId) as unknown as InviteRow[];
    const outgoing = database.prepare(`
      SELECT i.id, i.created_at, u.id AS user_id, u.name, u.avatar
      FROM invites i JOIN users u ON u.id = i.recipient_id
      WHERE i.sender_id = ? ORDER BY i.created_at, i.id
    `).all(userId) as unknown as InviteRow[];
    response.json({
      incoming: incoming.map((invite) => ({ id: invite.id, sender: { id: invite.user_id, name: invite.name, avatar: invite.avatar }, created_at: invite.created_at })),
      outgoing: outgoing.map((invite) => ({ id: invite.id, recipient: { id: invite.user_id, name: invite.name, avatar: invite.avatar }, created_at: invite.created_at })),
    });
  });

  api.post('/invites/:user_id/decline', (request, response) => {
    const recipientId = response.locals.userId as number;
    requireUser(database, recipientId);
    const senderId = parseId(request.params.user_id);
    const result = database.prepare('DELETE FROM invites WHERE sender_id = ? AND recipient_id = ?').run(senderId, recipientId);
    if (result.changes === 0) throw new ApiError(404, 'INVITE_NOT_FOUND', 'Incoming invitation not found');
    response.json({ message: 'Invitation declined' });
  });

  api.post('/invites/:user_id/accept', (request, response) => {
    const recipientId = response.locals.userId as number;
    requireUser(database, recipientId);
    const senderId = parseId(request.params.user_id);
    transaction(database, () => {
      const invite = database.prepare('SELECT id FROM invites WHERE sender_id = ? AND recipient_id = ?').get(senderId, recipientId);
      if (!invite) throw new ApiError(404, 'INVITE_NOT_FOUND', 'Incoming invitation not found');
      database.prepare('DELETE FROM invites WHERE sender_id = ? AND recipient_id = ?').run(senderId, recipientId);
      const [low, high] = pair(senderId, recipientId);
      database.prepare('INSERT INTO friendships (user_low_id, user_high_id) VALUES (?, ?)').run(low, high);
    });
    response.json({ message: 'Invitation accepted' });
  });

  api.delete('/friends/:id', (request, response) => {
    const userId = response.locals.userId as number;
    requireUser(database, userId);
    const friendId = parseId(request.params.id);
    const [low, high] = pair(userId, friendId);
    const result = database.prepare('DELETE FROM friendships WHERE user_low_id = ? AND user_high_id = ?').run(low, high);
    if (result.changes === 0) throw new ApiError(404, 'FRIEND_NOT_FOUND', 'Friendship not found');
    response.json({ message: 'Friend deleted' });
  });

  api.get('/friends', (_request, response) => {
    const userId = response.locals.userId as number;
    requireUser(database, userId);
    const rows = database.prepare(`
      SELECT u.id, u.name, u.avatar, l.latitude, l.longitude, l.accuracy, l.timestamp
      FROM friendships f
      JOIN users u ON u.id = CASE WHEN f.user_low_id = ? THEN f.user_high_id ELSE f.user_low_id END
      LEFT JOIN locations l ON l.user_id = u.id
      WHERE f.user_low_id = ? OR f.user_high_id = ?
      ORDER BY u.name COLLATE NOCASE, u.id
    `).all(userId, userId, userId) as unknown as Array<{
      id: number; name: string | null; avatar: string | null;
      latitude: number | null; longitude: number | null; accuracy: number | null; timestamp: string | null;
    }>;
    response.json(rows.map((row) => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      location: row.timestamp === null ? null : {
        latitude: String(row.latitude),
        longitude: String(row.longitude),
        timestamp: row.timestamp,
      },
    })));
  });

  app.use('/api', api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, close: () => database.close() };
}
