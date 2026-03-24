# SafePaws2

Mobile app built with [Expo](https://expo.dev/) (React Native), [expo-router](https://docs.expo.dev/router/introduction/), Redux, and [Supabase](https://supabase.com/) for auth and data.

## Prerequisites

- **Node.js** (LTS recommended, e.g. 20+)
- **npm** (comes with Node)
- For physical devices: **Expo Go** from the App Store or Play Store, or a dev build from `expo run:ios` / `expo run:android`
- For iOS simulators: **Xcode** (macOS only)
- For Android emulators: **Android Studio** and an AVD

## 1. Install dependencies

From the project root:

```bash
npm install
```

## 2. Environment variables

The app reads Supabase settings from Expo public env vars (see `src/lib/supabase.ts`). Create a file named `.env` in the project root (this file is gitignored).

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Get `URL` and **anon** `key` from the Supabase dashboard: **Project Settings → API**.

Restart the dev server after changing `.env`.

## 3. Run the app

Start the Metro bundler and QR / dev menu:

```bash
npm start
```

Then:

- Press **i** for iOS simulator, **a** for Android emulator, or **w** for web (if supported by your setup)
- Or scan the QR code with **Expo Go** on a phone (same network as your machine)

Other useful scripts:

| Command | Purpose |
|--------|---------|
| `npm run ios` | Build and run on iOS (native project generated as needed) |
| `npm run android` | Build and run on Android |
| `npm run web` | Start with web target |

## 4. Supabase backend

The `supabase/` folder holds migrations and Edge Functions for this project. To run Supabase locally or link a remote project, use the [Supabase CLI](https://supabase.com/docs/guides/cli); the app itself only needs the URL and anon key in `.env` to talk to your hosted (or local) instance.

## Troubleshooting

- **Blank Supabase errors or failed requests:** Confirm `.env` exists, variables are spelled exactly as above, and you restarted `npm start`.
- **Session not persisting:** `src/lib/supabase.ts` currently uses in-memory auth storage for minimal native setup. For persistent login across restarts, wire in `AsyncStorage` (or SecureStore) in the `createClient` `auth.storage` option.

## License

Private project (`package.json` marks the repo as private).
