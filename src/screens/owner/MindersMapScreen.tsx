import React, { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import * as Location from 'expo-location'
import { useSelector } from 'react-redux'

import MindersMapView from '../../components/maps/MindersMapView'
import type { MapPin } from '../../components/maps/MindersMapView.types'
import { RootState } from '../../store'
import { Listing } from '../../types/Listing'
import { User } from '../../types/User'
import {
  bulkGeocodeUkPostcodes,
  geocodeAddressFallback,
  geocodeUkPostcode,
  normalizeUkPostcode,
  resolveSearchCentre,
} from '../../utils/geocodePostcode'

type ListingWithUser = Listing & { user?: User | null }

export default function MindersMapScreen() {
  const navigation = useNavigation()
  const listings = useSelector((s: RootState) => s.listings.listings) as ListingWithUser[]
  const filterPostcode = useSelector((s: RootState) => s.listings.activeFilters.postcode)

  const [pins, setPins] = useState<MapPin[]>([])
  const [center, setCenter] = useState<{ latitude: number; longitude: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUser, setShowUser] = useState(false)

  const buildPins = useCallback(async () => {
    setLoading(true)
    try {
      const pc = filterPostcode?.trim()
      if (pc) {
        const c = await resolveSearchCentre(pc)
        setCenter(c ? { latitude: c.lat, longitude: c.lng } : null)
      } else {
        setCenter(null)
      }

      const bulk = await bulkGeocodeUkPostcodes(listings.map((l) => l.postcode))
      const out: MapPin[] = []

      for (const list of listings) {
        const key = normalizeUkPostcode(list.postcode ?? '')
        let lat: number | undefined
        let lng: number | undefined

        if (key && bulk.has(key)) {
          const coord = bulk.get(key)!
          lat = coord.lat
          lng = coord.lng
        } else if (list.postcode?.trim()) {
          const one = await geocodeUkPostcode(list.postcode)
          if (one) {
            lat = one.lat
            lng = one.lng
          }
        }
        if (lat == null || lng == null) {
          const line = [list.postcode, list.location].filter(Boolean).join(', ')
          const fb = line
            ? await geocodeAddressFallback(line && !/\buk\b/i.test(line) ? `${line}, UK` : line)
            : null
          if (fb) {
            lat = fb.lat
            lng = fb.lng
          }
        }
        if (lat == null || lng == null) continue

        const u = list.user
        out.push({
          id: list.id,
          latitude: lat,
          longitude: lng,
          title: u?.display_name || u?.username || 'Pet minder',
          subtitle: list.postcode || list.location || undefined,
          variant: 'minder',
        })
      }
      setPins(out)
    } finally {
      setLoading(false)
    }
  }, [listings, filterPostcode])

  useEffect(() => {
    void buildPins()
  }, [buildPins])

  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setShowUser(status === 'granted')
    })()
  }, [])

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Minders map</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.hint}>
        Green pins: pet minders from your current search. Red pin: centre of your postcode filter (when set).
      </Text>

      <View style={styles.mapWrap}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Plotting locations…</Text>
          </View>
        ) : (
          <MindersMapView pins={pins} center={center} showUserLocation={showUser} style={styles.map} />
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Live GPS during bookings</Text>
        <Text style={styles.footerBody}>
          When a walk or visit is in progress, open the booking and use &quot;Live pet location&quot; to follow the
          minder&apos;s GPS on a map (minder shares location during the session).
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  back: { paddingVertical: 8, paddingHorizontal: 4 },
  backText: { fontSize: 16, color: '#1565c0', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#1f1f1f' },
  headerSpacer: { width: 56 },
  hint: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  mapWrap: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    minHeight: 260,
  },
  map: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: { marginTop: 10, color: '#666' },
  footer: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  footerTitle: { fontSize: 14, fontWeight: '700', color: '#1b4332', marginBottom: 6 },
  footerBody: { fontSize: 13, color: '#555', lineHeight: 19 },
})
