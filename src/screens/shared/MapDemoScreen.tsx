import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import * as Location from 'expo-location'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'

import PetLocationMap from '@/src/components/maps/PetLocationMap'

export default function MapDemoScreen() {
  const navigation = useNavigation()
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null

    void (async () => {
      setError(null)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setError('Location permission is off. Enable it in system settings to see your live position on the map.')
        setLoading(false)
        return
      }

      try {
        const first = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        setLatitude(first.coords.latitude)
        setLongitude(first.coords.longitude)
        setLoading(false)
      } catch (e) {
        setError('Could not read GPS. Try again outdoors or check location services.')
        setLoading(false)
        return
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 4000,
          distanceInterval: 15,
        },
        (loc) => {
          setLatitude(loc.coords.latitude)
          setLongitude(loc.coords.longitude)
        }
      )
    })()

    return () => {
      subscription?.remove()
    }
  }, [])

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Map</Text>
        <Text style={styles.subtitle}>Your live position (updates as you move)</Text>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Getting your location…</Text>
        </View>
      )}

      {error != null && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {latitude != null && longitude != null && (
        <PetLocationMap
          latitude={latitude}
          longitude={longitude}
          markerTitle="You are here"
          style={styles.map}
        />
      )}

      {latitude != null && longitude != null && (
        <View style={styles.footer}>
          <Text style={styles.coords}>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  back: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: 16, color: '#2E7D32', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: '#1b4332' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  loadingBox: {
    flex: 1,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: { marginTop: 12, color: '#555', fontSize: 15 },
  errorBox: { paddingHorizontal: 16, marginBottom: 12 },
  errorText: { color: '#c0392b', fontSize: 15, lineHeight: 22 },
  map: { flex: 1, marginHorizontal: 16, marginBottom: 8, minHeight: 320 },
  footer: { paddingHorizontal: 16, paddingBottom: 16 },
  coords: { fontSize: 13, color: '#555', fontFamily: 'monospace' },
})
