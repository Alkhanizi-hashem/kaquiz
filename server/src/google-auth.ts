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
  const resolveKey: JWTVerifyGetKey = async (header, token) => {
    try {
      return await keys(header, token);
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? error.code : undefined;
      // Only key-fetch infrastructure failures are service outages. A missing
      // matching key or bad token remains an authentication failure below.
      if (error instanceof TypeError || code === 'ERR_JWKS_TIMEOUT' || code === 'ERR_JOSE_GENERIC' || code === 'ERR_JWKS_INVALID') {
        console.warn('Google sign-in key service unavailable'); // No token, claims or provider error details.
        throw new ApiError(503, 'GOOGLE_UNAVAILABLE', 'Google sign-in is temporarily unavailable. Please try again later.');
      }
      throw error;
    }
  };
  return async (idToken: string) => {
    try {
      const { payload } = await jwtVerify(idToken, resolveKey, {
        algorithms: ['RS256'],
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: clientId,
        requiredClaims: ['sub', 'email', 'email_verified', 'exp', 'iat'],
        maxTokenAge: '1h',
      });
      const identity = identitySchema.parse(payload);
      // A provider subject, not email, is the account's permanent identity.
      return { subject: identity.sub, email: identity.email.toLowerCase(), name: identity.name?.slice(0, 100) ?? null };
    } catch (error) {
      if (error instanceof ApiError && error.code === 'GOOGLE_UNAVAILABLE') throw error;
      throw new ApiError(401, 'INVALID_GOOGLE_TOKEN', 'Google sign-in could not be verified. Please try again.');
    }
  };
}

export type GoogleVerifier = ReturnType<typeof createGoogleVerifier>;
