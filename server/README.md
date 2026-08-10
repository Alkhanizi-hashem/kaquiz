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

The API is available at `http://localhost:3000/api` by default. `GET /api/health` returns a readiness check. The server creates the SQLite database and fresh schema on startup; delete any older local pre-release database before starting this version.

Only these environment variables are used:

- `JWT_SECRET`: required secret of at least 32 characters.
- `PORT`: local HTTP port, default `3000`.
- `DATABASE_PATH`: SQLite path, default `./kaquiz.sqlite`; use `:memory:` for ephemeral runs.
- `CORS_ORIGIN`: exact allowed client origin, default `http://localhost:8081`.

## Authentication

- `POST /api/auth/register` accepts `{name,email,password}` and immediately returns `{access_token,user}`.
- `POST /api/auth/login` accepts `{email,password}` and returns `{access_token,user}`.
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
