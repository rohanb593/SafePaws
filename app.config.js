/**
 * Extends app.json with native map keys. Expo uses this file when present (see app.json for base config).
 *
 * Android: Google Maps SDK (used by react-native-maps) requires an API key — OSM tiles alone are not enough.
 * Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env / EAS env, then run `npx expo prebuild` (or EAS build).
 *
 * @see https://docs.expo.dev/guides/google-maps/
 */
const appJson = require('./app.json')

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      config: {
        ...(appJson.expo.android && appJson.expo.android.config),
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    ios: {
      ...appJson.expo.ios,
      config: {
        ...(appJson.expo.ios && appJson.expo.ios.config),
        googleMapsApiKey: googleMapsApiKey,
      },
    },
  },
}
