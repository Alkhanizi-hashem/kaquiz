# Kaquiz Server

Local TypeScript and Express 5 REST API backed by Node.js 24's built-in `node:sqlite` module.

## Setup

Requirements are Node.js 24 or newer and a cryptographically random JWT secret containing at least 32 characters.

```sh
cd server
npm install
cp .env.example .env
npm run dev
```

The API is available at `http://localhost:3000/api` by default. `GET /api/health` returns a readiness check. The server creates the SQLite database on startup. Existing databases receive an additive Google identity/password-enabled migration; back up the SQLite database before upgrading. Do not delete existing account data.

Only these environment variables are used:

- `JWT_SECRET`: required secret of at least 32 characters.
- `PORT`: local HTTP port, default `3000`.
- `DATABASE_PATH`: SQLite path, default `./kaquiz.sqlite`; use `:memory:` for ephemeral runs.
- `GOOGLE_WEB_CLIENT_ID`: optional public Google Web OAuth client ID, matching the client. Omit to disable Google sign-in. No client secret is needed.
- `CORS_ORIGIN`: exact allowed client origin, default `http://localhost:8081`.

## Authentication

- `POST /api/auth/register` accepts `{name,email,password}` and immediately returns `{access_token,user}`.
- `POST /api/auth/login` accepts `{email,password}` and returns `{access_token,user}`.
- `POST /api/auth/google` accepts `{id_token}` from the official Google SDK and returns `{access_token,user}` after server verification.
- `POST /api/auth/logout` revokes the presented session.
- `GET /api/users/me` returns the authenticated user.

Emails are trimmed, lowercased, and unique. Passwords must contain 12 through 128 characters with at least one letter and one digit. They are stored using native Node.js `scrypt` with a random salt. Access tokens expire after seven days and map to revocable server-side sessions.

Send the returned token on protected requests:

```http
Authorization: Bearer <access_token>
```

Authentication attempts are limited to 20 per 15-minute window per client. JSON bodies are limited to 32 KB. Location accuracy is stored internally and is never returned in friend location responses. Clients may submit updates every five seconds; each user retains only the latest location.

## Commands

```sh
npm test
npm run typecheck
npm run build
npm audit
npm start
```

Run `npm run build` before `npm start`. `SIGINT` and `SIGTERM` close HTTP and SQLite cleanly.

## Google identity security

See [Google setup and iPhone demo checklist](../GOOGLE_AUTH.md). The server verifies Google's RS256 signature from a fixed HTTPS JWKS URL, issuer, audience, expiry, issued-at freshness (at most one hour), required claims, and `email_verified === true`. It never trusts client-supplied profile data. Google subject (`sub`) is the stable identity; changing Google's email does not change the linked Kaquiz user.

An email collision returns `409 GOOGLE_ACCOUNT_CONFLICT`: sign in with the existing account's method. There is deliberately no automatic email-based linking or linking endpoint. Password registration does not verify ownership, so automatic linking would be unsafe. OAuth-only users have `password_enabled = 0` and an empty non-credential hash; password login explicitly rejects them. The additive migration retains all existing hashes and relationships.

ID tokens are bearer credentials and can be reused until Google expiry (native SDKs may cache them); this is not a one-time authorization-code/nonce exchange. Do not log tokens. Production API transport must be HTTPS. Google sign-in issues the same seven-day revocable Kaquiz sessions as password login; Google access/refresh tokens are never stored. Logging out revokes only the Kaquiz session, not the user's Google account consent.
