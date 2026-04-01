import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import MapView, { Marker, UrlTile } from 'react-native-maps'

import type { PetLocationMapProps } from './PetLocationMap.types'

/** OpenStreetMap raster tiles — no Google/Apple paid API keys required. */
const OSM_TILE_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

/**
 * Map centered on a single coordinate with OSM tiles and required attribution.
 */
export default function PetLocationMap({
  latitude,
  longitude,
  markerTitle = 'Pet location',
  style,
}: PetLocationMapProps) {
  const region = useMemo(
    () => ({
      latitude,
      longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    }),
    [latitude, longitude]
  )

  return (
    <View style={[styles.wrap, style]}>
      <MapView
        style={StyleSheet.absoluteFill}
        mapType="none"
        initialRegion={region}
        region={region}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <UrlTile
          urlTemplate={OSM_TILE_TEMPLATE}
          maximumZ={19}
          flipY={false}
        />
        <Marker
          coordinate={{ latitude, longitude }}
          title={markerTitle}
          pinColor="#2E7D32"
        />
      </MapView>
      <Text style={styles.attribution} numberOfLines={1}>
        © OpenStreetMap contributors
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e8e8e8',
  },
  attribution: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    left: 6,
    fontSize: 10,
    color: 'rgba(0,0,0,0.55)',
    textAlign: 'right',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
})
