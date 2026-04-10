import { Alert, Platform } from 'react-native'
import * as Location from 'expo-location'
import type { RealtimeChannel } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'

/**
 * Push the latest coordinates for a booking (minder device → Supabase).
 * Uses upsert on `booking_id` so one row per active session.
 */
export async function updateGPSLocation(
  bookingId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  const { error } = await supabase.from('gps_locations').upsert(
    {
      booking_id: bookingId,
      latitude,
      longitude,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'booking_id' }
  )
  if (error) {
    console.warn('[useGPS] updateGPSLocation', error.message)
  }
}

export type GPSTrackingOptions = {
  /** Optional: update local UI whenever the device reports a fix (e.g. minder session map). */
  onLocation?: (latitude: number, longitude: number) => void
}

/**
 * Start watching GPS and sync to Supabase every ~30s (NF3).
 * Returns a cleanup function that stops the watcher.
 */
export function startGPSTracking(bookingId: string, options?: GPSTrackingOptions): () => void {
  let cancelled = false
  let subscription: Location.LocationSubscription | null = null
  const { onLocation } = options ?? {}

  void (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (cancelled) return

    if (status !== 'granted') {
      Alert.alert(
        'Location needed',
        Platform.select({
          ios: 'Enable location in Settings so the pet owner can see your position during the session.',
          default:
            'Allow location access so the pet owner can follow this walk on the map.',
        })
      )
      return
    }

    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      if (cancelled) return
      const { latitude, longitude } = current.coords
      onLocation?.(latitude, longitude)
      await updateGPSLocation(bookingId, latitude, longitude)
    } catch (e) {
      console.warn('[useGPS] getCurrentPositionAsync', e)
    }

    if (cancelled) return

    subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30_000,
        distanceInterval: 5,
      },
      (loc) => {
        const { latitude, longitude } = loc.coords
        onLocation?.(latitude, longitude)
        void updateGPSLocation(bookingId, latitude, longitude)
      }
    )

    if (cancelled) {
      subscription.remove()
      subscription = null
    }
  })()

  return () => {
    cancelled = true
    subscription?.remove()
    subscription = null
  }
}

/**
 * Subscribe to realtime updates for a booking's GPS row (owner view).
 */
export function subscribeToGPS(
  bookingId: string,
  onUpdate: (lat: number, lon: number) => void
): RealtimeChannel {
  return supabase
    .channel(`gps-loc-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'gps_locations',
        filter: `booking_id=eq.${bookingId}`,
      },
      (payload) => {
        const row = payload.new as { latitude?: number; longitude?: number } | null
        if (row?.latitude != null && row?.longitude != null) {
          onUpdate(row.latitude, row.longitude)
        }
      }
    )
    .subscribe()
}

/**
 * Last known position for a booking (e.g. initial map pin before realtime connects).
 */
export async function fetchLastLocation(
  bookingId: string
): Promise<{ latitude: number; longitude: number; updated_at: string | null } | null> {
  const { data, error } = await supabase
    .from('gps_locations')
    .select('latitude, longitude, updated_at')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (error) {
    console.warn('[useGPS] fetchLastLocation', error.message)
    return null
  }
  if (!data) return null

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    updated_at: data.updated_at ?? null,
  }
}
