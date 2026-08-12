# Kaquiz

Kaquiz is a full-stack Expo application for sharing a current location with accepted friends. Users create email/password accounts, discover another account by its exact email address, exchange explicit invitations, and view accepted friends on a map while the app is open.

The repository contains both the Expo client and a local TypeScript API backed by SQLite.

## Features

- Immediate email/password registration and login
- Native token storage with Expo SecureStore and browser storage with `localStorage`
- Exact-email account discovery with relationship-aware results
- Incoming and outgoing friend requests with accept and decline actions
- Friend removal with confirmation
- Native maps through `react-native-maps` and a Leaflet implementation for web
- Foreground-only location sharing at a five-second cadence
- Friend-location refresh every five seconds and invitation refresh every three seconds
- In-app notification toast and tab badge for new incoming requests
- Profile editing for display name and an optional avatar URL
- Loading, permission, offline, empty, and retry states throughout the client

## Tech Stack

### Client

- Expo SDK 57, React Native 0.86, React 19, and TypeScript
- Expo Router with typed routes and native tabs
- TanStack Query for server state, polling, caching, and invalidation
- Expo Location for foreground position updates
- Expo SecureStore for native session tokens
- React Native Maps on native platforms and Leaflet on web

### Server

- Node.js 24, TypeScript, and Express 5
- Node's built-in `node:sqlite` database with WAL mode and strict tables
- JOSE-signed HS256 access tokens with revocable, seven-day server sessions
- Native `scrypt` password hashing with random salts
- Zod request and environment validation
- Helmet, CORS, JSON size limits, and authentication rate limiting

## Project Structure

```text
src/
|-- app/          Expo Router screens for auth, map, friends, requests, and profile
|-- components/   Shared controls, maps, avatars, cards, and status UI
|-- hooks/        TanStack Query queries and mutations
|-- lib/          API client, storage, validation, and location helpers
|-- providers/    Authentication, location, and friend-request orchestration
`-- types/        Client API contracts
server/
|-- src/          Express API, auth, configuration, and SQLite schema
`-- test/         End-to-end HTTP API tests
swagger.yml       API description
```

### Data and Privacy Model

- Passwords must contain 12 to 128 characters, at least one letter, and at least one digit.
- The API stores only each user's latest location. Submitted accuracy is retained internally but is not returned to friends.
- Location subscriptions run only for an authenticated user while the app is active. They stop in the background and on logout.
- A location is returned only through the accepted-friends endpoint.
- Logging out clears the token, authenticated user, and all cached queries on the client.

## Getting Started

### Prerequisites

- Node.js 24 or newer and npm
- An Expo SDK 57-compatible iOS, Android, or web development target
- Location services for testing the sharing flow

### Install Dependencies

From the repository root:

```sh
npm ci
npm --prefix server ci
```

### Configure the Server

```sh
cp server/.env.example server/.env
```

Replace the example `JWT_SECRET` with a cryptographically random value of at least 32 characters. The server reads these variables:

| Variable | Purpose | Default in example |
| --- | --- | --- |
| `JWT_SECRET` | Required token-signing secret | Placeholder, must be replaced |
| `PORT` | HTTP port | `3000` |
| `DATABASE_PATH` | SQLite database path | `./kaquiz.sqlite` |
| `CORS_ORIGIN` | Allowed browser origin | `http://localhost:8081` |

The database file and schema are created automatically when the server starts.

### Configure the Client

```sh
cp .env.example .env.local
```

Set `EXPO_PUBLIC_API_URL` for the target that will run the client:

| Target | Value |
| --- | --- |
| iOS simulator or web | `http://localhost:3000/api` |
| Android emulator | `http://10.0.2.2:3000/api` |
| Physical device | `http://<COMPUTER_LAN_IP>:3000/api` |

For web, keep `CORS_ORIGIN` aligned with the origin printed by Expo. For a physical device, keep the device and development computer on the same network and restart Expo after changing `.env.local`.

### Run Locally

Start the API in one terminal:

```sh
npm --prefix server run dev
```

Start the Expo client in another terminal:

```sh
npm start
```

Press `i`, `a`, or `w` for iOS, Android, or web. There are no bundled demo accounts; create two accounts to exercise the complete friendship flow.

For a compiled server build:

```sh
npm --prefix server run build
npm --prefix server start
```

## Usage

1. Create an account and grant foreground location access.
2. Create a second account with a different email address.
3. Search for the other account using its complete email and send a request.
4. Sign in as the recipient and accept or decline the request from Requests.
5. After acceptance, open Friends or Map to inspect the latest shared location.
6. Edit the current profile or remove a friendship as needed.

## Quality Checks

Client checks:

```sh
npm test
npm run lint
npm run typecheck
npx expo-doctor
```

Server checks:

```sh
npm --prefix server test
npm --prefix server run typecheck
npm --prefix server run build
```

At the current revision, the client tests pass, but `npm run typecheck` stops at `src/components/friends-map.web.tsx` because TypeScript cannot resolve the side-effect CSS import `leaflet/dist/leaflet.css`. This is an existing source/tooling issue rather than additional setup required by the application.
