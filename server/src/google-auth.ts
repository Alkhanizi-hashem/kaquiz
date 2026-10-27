import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';

import { ApiError } from './errors.js';

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const identitySchema = z.object({
  sub: z.string().min(1).max(255),
  email: z.email().max(254),
  email_verified: z.literal(true),
  name: z.string().optional(),
});

// The key resolver is injectable for offline signature-verification tests only.
// Production always resolves Google's HTTPS JWKS, never a URL from the token.
export function createGoogleVerifier(clientId: string, keys: JWTVerifyGetKey = googleKeys) {
  if (!clientId.trim()) throw new Error('A Google OAuth web client ID is required');
  return async (idToken: string) => {
    try {
      const { payload } = await jwtVerify(idToken, keys, {
        algorithms: ['RS256'],
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: clientId,
        requiredClaims: ['sub', 'email', 'email_verified', 'exp', 'iat'],
        maxTokenAge: '1h',
      });
      const identity = identitySchema.parse(payload);
      // A provider subject, not email, is the account's permanent identity.
      return { subject: identity.sub, email: identity.email.toLowerCase(), name: identity.name?.slice(0, 100) ?? null };
    } catch {
      throw new ApiError(401, 'INVALID_GOOGLE_TOKEN', 'Google sign-in could not be verified. Please try again.');
    }
  };
}

export type GoogleVerifier = ReturnType<typeof createGoogleVerifier>;
