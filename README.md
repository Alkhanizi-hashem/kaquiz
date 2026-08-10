# Kaquiz

Kaquiz is a local-audit Expo app for sharing current locations with accepted friends. It uses immediate email/password accounts, exact-email friend discovery, explicit invitations, and a live atlas while the app is open.

## App contract

- `POST /auth/register` accepts `name`, `email`, and `password`, then returns `{ access_token, user }`.
- `POST /auth/login` accepts `email` and `password`, then returns `{ access_token, user }`.
- Native sessions use Expo SecureStore. Browser sessions use origin-local storage.
- Logout clears the token, user, and every cached query so a second local account starts cleanly.
- Foreground location is posted to `/locations` immediately and every five seconds while the app remains active.
- Only accepted friends appear in the friend list and location atlas.

## Local API URL

Create `.env.local` from `.env.example`, then choose the address for the target running the app:

```sh
cp .env.example .env.local
```

- iOS simulator and web: `EXPO_PUBLIC_API_URL=http://localhost:3000/api`
- Android emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api`
- Physical device: use the computer's LAN address, such as `EXPO_PUBLIC_API_URL=http://192.168.1.10:3000/api`

Restart Expo after changing the URL. A physical device and the computer must be on the same network, and the API must listen on an address reachable from that device.

## Run locally

Start the local API in one terminal:

```sh
npm --prefix server install
npm --prefix server run dev
```

Start the Expo app in another terminal:

```sh
npm install
npx expo start
```

Use Expo Go first. Press `i`, `a`, or `w` for the iOS simulator, Android emulator, or web.

## Local audit

1. Open Kaquiz and select **Create account**.
2. Enter a name, exact email address, and a password of at least 12 characters containing a letter and number. Submission enters the atlas immediately.
3. Allow foreground location access and confirm the map status reads **LIVE**.
4. Open **Profile**, confirm the account email, then use **Logout**.
5. Create a second account and open **Friends** > **Find a friend**.
6. Search for the first account using its complete email. Send the relationship-aware friend request.
7. Logout, sign into the first account, open **Requests**, and decline once to audit decline behavior.
8. Repeat the request, then accept it from **Requests**.
9. Confirm the second account appears in **Friends** and on **Map** after its foreground location update.
10. In **Friends**, choose **Remove friend** and confirm the destructive dialog before deletion.
11. Logout and sign into the other account to confirm no previous account state or cached data remains.

No developer shortcut or sample account is provided. Use two real locally-created accounts.

## App checks

```sh
npm test
npm run lint
npm run typecheck
npx expo-doctor
EXPO_PUBLIC_API_URL=http://localhost:3000/api npx expo export --platform ios --output-dir /tmp/kaquiz-ios
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api npx expo export --platform android --output-dir /tmp/kaquiz-android
EXPO_PUBLIC_API_URL=http://localhost:3000/api npx expo export --platform web --output-dir /tmp/kaquiz-web
```

## Privacy

- Location permission and updates are foreground-only.
- Location sharing pauses when Kaquiz is backgrounded and stops on logout.
- Location data is shown only for accepted friendships.
- Friend discovery requires a complete email address.
