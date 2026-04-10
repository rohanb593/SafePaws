import React from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import type { MindersMapViewProps } from './MindersMapView.types'

export default function MindersMapView({ pins, center, style }: MindersMapViewProps) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.title}>Map preview (native app)</Text>
      <Text style={styles.sub}>
        On web, open pins in OpenStreetMap. Use the iOS/Android app for the full interactive map.
      </Text>
      <ScrollView style={styles.scroll}>
        {center ? (
          <Pressable
            onPress={() =>
              void Linking.openURL(
                `https://www.openstreetmap.org/?mlat=${center.latitude}&mlon=${center.longitude}#map=13/${center.latitude}/${center.longitude}`
              )
            }
            style={styles.row}
          >
            <Text style={styles.pinLabel}>Search centre</Text>
            <Text style={styles.coords}>
              {center.latitude.toFixed(4)}, {center.longitude.toFixed(4)}
            </Text>
          </Pressable>
        ) : null}
        {pins.map((p) => {
          const url = `https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=14/${p.latitude}/${p.longitude}`
          return (
            <Pressable key={p.id} onPress={() => void Linking.openURL(url)} style={styles.row}>
              <Text style={styles.pinLabel}>{p.title}</Text>
              {p.subtitle ? <Text style={styles.subtitle}>{p.subtitle}</Text> : null}
              <Text style={styles.coords}>
                {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
      <Text style={styles.note}>© OpenStreetMap contributors</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 280,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e8eef0',
    padding: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#1b4332', marginBottom: 6 },
  sub: { fontSize: 13, color: '#555', marginBottom: 10 },
  scroll: { maxHeight: 220 },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  pinLabel: { fontWeight: '600', color: '#1f1f1f' },
  subtitle: { fontSize: 13, color: '#666' },
  coords: { fontSize: 12, fontFamily: 'monospace', color: '#333', marginTop: 4 },
  note: { marginTop: 8, fontSize: 10, color: 'rgba(0,0,0,0.5)' },
})
