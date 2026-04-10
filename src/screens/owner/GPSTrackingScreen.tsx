import React, { useCallback, useEffect, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'

import PetLocationMap from '@/src/components/maps/PetLocationMap'
import { fetchLastLocation, subscribeToGPS } from '@/src/hooks/useGPS'
import { supabase } from '@/src/lib/supabase'

function formatUpdatedAt(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export default function GPSTrackingScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const bookingId = (route.params as { bookingId: string }).bookingId

  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const pulse = useState(() => new Animated.Value(1))[0]

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  const applyCoords = useCallback((lat: number, lon: number, at?: string | null) => {
    setLatitude(lat)
    setLongitude(lon)
    if (at != null) setUpdatedAt(at)
    setLive(true)
  }, [])

  useEffect(() => {
    let mounted = true

    void (async () => {
      const last = await fetchLastLocation(bookingId)
      if (!mounted || !last) return
      applyCoords(last.latitude, last.longitude, last.updated_at)
    })()

    const channel = subscribeToGPS(bookingId, (lat, lon) => {
      applyCoords(lat, lon, new Date().toISOString())
    })

    return () => {
      mounted = false
      void supabase.removeChannel(channel)
    }
  }, [bookingId, applyCoords])

  /** If Realtime is not enabled for `gps_locations`, polling still picks up minder upserts. */
  useEffect(() => {
    if (latitude != null && longitude != null) return
    const interval = setInterval(() => {
      void (async () => {
        const last = await fetchLastLocation(bookingId)
        if (last) applyCoords(last.latitude, last.longitude, last.updated_at)
      })()
    }, 8000)
    return () => clearInterval(interval)
  }, [bookingId, latitude, longitude, applyCoords])

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Live pet location</Text>
        <View style={styles.liveRow}>
          <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
          <Text style={styles.liveLabel}>{live ? 'Live' : 'Connecting…'}</Text>
        </View>
      </View>

      {latitude != null && longitude != null ? (
        <PetLocationMap
          latitude={latitude}
          longitude={longitude}
          markerTitle="Pet last seen here"
          style={styles.map}
        />
      ) : (
        <View style={[styles.map, styles.placeholder]}>
          <Text style={styles.placeholderText}>
            Waiting for the minder’s GPS…{'\n'}
            Position will appear here during the session.
          </Text>
        </View>
      )}

      <View style={styles.meta}>
        <Text style={styles.metaLabel}>Latitude</Text>
        <Text style={styles.metaValue}>{latitude?.toFixed(6) ?? '—'}</Text>
        <Text style={styles.metaLabel}>Longitude</Text>
        <Text style={styles.metaValue}>{longitude?.toFixed(6) ?? '—'}</Text>
        <Text style={styles.metaLabel}>Last updated</Text>
        <Text style={styles.metaValue}>{formatUpdatedAt(updatedAt)}</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  back: { marginBottom: 8, alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: '#2E7D32', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: '#1b4332' },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
  },
  liveLabel: { fontSize: 14, color: '#555', fontWeight: '600' },
  map: { marginHorizontal: 16, flex: 1 },
  placeholder: {
    backgroundColor: '#dde3e0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderText: {
    textAlign: 'center',
    color: '#444',
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    padding: 16,
    gap: 4,
  },
  metaLabel: { fontSize: 12, color: '#666', textTransform: 'uppercase' },
  metaValue: { fontSize: 15, color: '#222', marginBottom: 8 },
})
