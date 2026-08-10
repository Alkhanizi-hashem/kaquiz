import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { RequestHandler } from 'express';
import { jwtVerify, SignJWT } from 'jose';

import { ApiError } from './errors.js';

const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

export function createTokenService(secret: string, database: DatabaseSync) {
  const key = new TextEncoder().encode(secret);
  return {
    async issue(userId: number) {
      const sessionId = randomUUID();
      const expiresAt = Math.floor(Date.now() / 1_000) + SESSION_DURATION_SECONDS;
      const accessToken = await new SignJWT({})
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setSubject(String(userId))
        .setJti(sessionId)
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .sign(key);
      database.prepare('INSERT INTO sessions (jti, user_id, expires_at) VALUES (?, ?, ?)')
        .run(sessionId, userId, new Date(expiresAt * 1_000).toISOString());
      return accessToken;
    },
    authenticate: (async (request, response, next) => {
      const header = request.get('authorization');
      if (!header?.startsWith('Bearer ')) {
        next(new ApiError(401, 'UNAUTHORIZED', 'A valid bearer token is required'));
        return;
      }
      try {
        const { payload } = await jwtVerify(header.slice(7), key, { algorithms: ['HS256'] });
        const userId = Number(payload.sub);
        const sessionId = payload.jti;
        if (!Number.isSafeInteger(userId) || userId <= 0 || !sessionId) throw new Error('Invalid token claims');
        const session = database.prepare(`
          SELECT 1 FROM sessions
          WHERE jti = ? AND user_id = ? AND revoked_at IS NULL AND expires_at > ?
        `).get(sessionId, userId, new Date().toISOString());
        if (!session) throw new Error('Inactive session');
        response.locals.userId = userId;
        response.locals.sessionId = sessionId;
        next();
      } catch {
        next(new ApiError(401, 'UNAUTHORIZED', 'A valid bearer token is required'));
      }
    }) satisfies RequestHandler,
  };
}
