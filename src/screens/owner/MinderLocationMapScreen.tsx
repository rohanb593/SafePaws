import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import * as Location from 'expo-location'

import MindersMapView from '../../components/maps/MindersMapView'
import type { MapPin } from '../../components/maps/MindersMapView.types'
import { supabase } from '../../lib/supabase'
import { Listing } from '../../types/Listing'
import { User } from '../../types/User'
import { coordinatesForListing, geocodeAddressFallback } from '../../utils/geocodePostcode'

export default function MinderLocationMapScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const minderId = (route.params as { minderId: string }).minderId

  const [pins, setPins] = useState<MapPin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUser, setShowUser] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: profileData }, { data: listingData }] = await Promise.all([
        supabase.from('profiles').select('display_name, username, location').eq('id', minderId).single(),
        supabase
          .from('listings')
          .select('id, postcode, location')
          .eq('user_id', minderId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      const profile = profileData as User | null
      const listing = listingData as Pick<Listing, 'id' | 'postcode' | 'location'> | null

      let coord: { lat: number; lng: number } | null = null
      if (listing) {
        coord = await coordinatesForListing(listing)
      }
      if (!coord && profile?.location?.trim()) {
        const loc = profile.location.trim()
        coord = await geocodeAddressFallback(/\buk\b/i.test(loc) ? loc : `${loc}, UK`)
      }

      if (!coord) {
        setPins([])
        setError('Could not find this area on the map. Ask the minder to add a postcode or location.')
        return
      }

      const title = profile?.display_name || profile?.username || 'Pet minder'
      const subtitle = [listing?.postcode, listing?.location].filter(Boolean).join(' · ') || profile?.location || undefined

      setPins([
        {
          id: listing?.id ?? minderId,
          latitude: coord.lat,
          longitude: coord.lng,
          title,
          subtitle,
          variant: 'minder',
        },
      ])
    } catch {
      setError('Failed to load map.')
      setPins([])
    } finally {
      setLoading(false)
    }
  }, [minderId])

  useEffect(() => {
    void load()
  }, [load])

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
        <Text style={styles.title}>Minder location</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.hint}>Pin shows the minder&apos;s listing area (postcode / location).</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading map…</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.mapWrap}>
          <MindersMapView pins={pins} center={null} showUserLocation={showUser} style={styles.map} />
        </View>
      )}
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
  mapWrap: { flex: 1, marginHorizontal: 16, marginBottom: 16, minHeight: 280 },
  map: { flex: 1 },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 200,
  },
  loadingText: { marginTop: 10, color: '#666' },
  errorText: { color: '#b71c1c', textAlign: 'center', lineHeight: 22, fontSize: 15 },
})
