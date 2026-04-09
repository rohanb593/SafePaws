import React from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'

import type { PetLocationMapProps } from './PetLocationMap.types'

/** Web: react-native-maps is not used; show coordinates + link to OSM (still free / no API key). */
export default function PetLocationMap({
  latitude,
  longitude,
  markerTitle = 'Pet location',
  style,
}: PetLocationMapProps) {
  const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.inner}>
        <Text style={styles.title}>{markerTitle}</Text>
        <Text style={styles.coords}>
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </Text>
        <Pressable
          onPress={() => {
            void Linking.openURL(url)
          }}
          style={styles.linkBtn}
        >
          <Text style={styles.linkText}>Open in OpenStreetMap</Text>
        </Pressable>
        <Text style={styles.note}>© OpenStreetMap contributors</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e8eef0',
  },
  inner: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b4332',
    marginBottom: 8,
  },
  coords: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#333',
    marginBottom: 12,
  },
  linkBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  linkText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  note: {
    marginTop: 12,
    fontSize: 10,
    color: 'rgba(0,0,0,0.5)',
  },
})
