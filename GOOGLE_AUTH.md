# Google sign-in setup (iPhone first)

Google sign-in is implemented locally, and the public Web/iOS client IDs supplied by the user are populated in the environment templates. **Google Console settings, native builds and live sign-in are not verified.** Email/password login remains available. No Google client secret belongs in this app.

## iPhone demo requirements

1. In your own Google Cloud project, configure the OAuth consent screen and permitted test users if the app is in testing. Create a **Web application** OAuth client for the backend audience and an **iOS** client for bundle ID `com.reboot01.kaquiz`. These must belong to the same project.
2. Set root `.env` (copy `.env.example`):
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`: the Web client ID, used to request the server-audience ID token on iPhone too.
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`: the iOS client ID.
   - `GOOGLE_IOS_URL_SCHEME`: the reversed iOS client ID from Google, typically starting `com.googleusercontent.apps.`. This is registered by `app.config.js` through the Google Sign-In Expo plugin.
   - `EXPO_PUBLIC_API_URL`: your reachable API URL ending `/api`. On a physical iPhone, `localhost` is the phone, not your development computer. Use a reachable HTTPS API; HTTP is development-only and may require platform transport exceptions.
3. Set `GOOGLE_WEB_CLIENT_ID` in the server environment as documented in `server/.env.example`. It must match the **Web** client ID above. Keep `JWT_SECRET` server-only and use HTTPS in production.
4. Install dependencies (`npm ci` and `cd server && npm ci`). Build a native app, e.g. `npx expo run:ios` on a Mac with Xcode, or your existing EAS development-build workflow. A physical iPhone requires appropriate Apple signing/provisioning. **Expo Go cannot run this native Google sign-in module.** Rebuild after changing URL-scheme/plugin configuration; restarting Metro alone is not enough.
5. Start the API and app, tap **Continue with Google**, select an account and grant consent. Verify protected screens, app restart/session restore, logout, cancellation and another sign-in. Test on the actual iPhone build before the audit.

If identifiers are absent, the Google button is hidden. In Expo Go with identifiers present, the screen explains that a development build is required; email login remains usable.

## Web (optional)

Add the exact app origin (such as `http://localhost:8081` for development and the production HTTPS origin) to the Web OAuth client's **Authorized JavaScript origins**. The web component loads Google's official Identity Services script and renders Google's own popup button. This is the JavaScript callback flow, not a server redirect flow: it exchanges the returned ID token with `/api/auth/google`. No client secret or custom redirect callback is used. Allow `https://accounts.google.com/gsi/client` and Google's required frame/connect endpoints in your deployment CSP. Popup blockers or a restrictive Cross-Origin-Opener-Policy can interfere; follow the Google setup guidance below.

## Android (optional)

Create an Android OAuth client for package `com.reboot01.kaquiz` and the signing certificate SHA-1 for each development/production build. Continue to use the Web client ID in `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. Google Play Services and a native build are required. The public `@react-native-google-signin/google-signin` package uses Google's **deprecated legacy Android SDK**, which currently remains functional. A future Android production release should evaluate Credential Manager (e.g. Expo's documented Nitro alternative); iOS uses Google's native iOS SDK.

## Identity and account safety

The app sends only the Google ID token to the server, then stores the returned Kaquiz session using the existing platform token storage. Google profile data supplied by the client is not trusted. The server validates the token and uses Google's stable `sub` identity, not email, to look up returning Google users.

An existing email/password account with the same email is **not automatically linked**. Existing password registration did not verify email ownership; auto-linking would be an account-takeover risk. A conflict directs the user to their existing sign-in method. Authenticated account linking is not part of this change. Do not delete or merge accounts to bypass the conflict.

Kaquiz logout revokes the Kaquiz session; it does not log the user out of their Google account or revoke Google consent. No Google refresh tokens or Google API permissions are requested. Web Kaquiz sessions retain the existing localStorage tradeoff; mitigate XSS and deploy HTTPS.

## References

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [Expo Google authentication guide](https://docs.expo.dev/guides/google-authentication/)
- [Google Sign-In Expo setup](https://react-native-google-signin.github.io/docs/setting-up/expo)
- [Native sign-in API](https://react-native-google-signin.github.io/docs/original)
- [Google Identity Services web setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)
- [Google ID token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)

## Public IDs configured for this handoff

- Web/backend audience: `650136318399-bb0p0hkvubvg46hm2kob1g50ja2p1526.apps.googleusercontent.com`
- iOS client: `650136318399-40lgba5pokpv30phdvlo80obbvpfj6j0.apps.googleusercontent.com`
- iOS reversed scheme: `com.googleusercontent.apps.650136318399-40lgba5pokpv30phdvlo80obbvpfj6j0`

These identifiers are public, not client secrets. The app still uses bundle ID
`com.reboot01.kaquiz`; confirm that the Google iOS client was registered for
that exact bundle ID. This was not independently checked in Google Console.
Copy the environment templates to the app/server environments and replace the
server JWT placeholder with a cryptographically random server-only secret.
Set a reachable HTTPS API URL for the physical iPhone. These IDs alone do not
start a backend, configure consent/test users, install or sign a native build,
or verify that Google accepts the configuration.
