import React, { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import MapView, { Circle, Marker, UrlTile } from 'react-native-maps'

import type { MindersMapViewProps } from './MindersMapView.types'

const OSM_TILE_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

const UK_REGION = {
  latitude: 53.5,
  longitude: -2.2,
  latitudeDelta: 6,
  longitudeDelta: 6,
}

export default function MindersMapView({
  pins,
  center,
  showUserLocation,
  style,
}: MindersMapViewProps) {
  const mapRef = useRef<MapView>(null)

  const coordinates = useMemo(() => {
    const c: { latitude: number; longitude: number }[] = pins.map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
    }))
    if (center) {
      c.push({ latitude: center.latitude, longitude: center.longitude })
    }
    return c
  }, [pins, center])

  useEffect(() => {
    if (coordinates.length === 0) return
    const t = setTimeout(() => {
      if (coordinates.length === 1) {
        mapRef.current?.animateToRegion({
          ...coordinates[0],
          latitudeDelta: 0.25,
          longitudeDelta: 0.25,
        })
      } else {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 48, bottom: 120, left: 48 },
          animated: true,
        })
      }
    }, 400)
    return () => clearTimeout(t)
  }, [coordinates])

  return (
    <View style={[styles.wrap, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapType="none"
        initialRegion={UK_REGION}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={showUserLocation}
      >
        <UrlTile urlTemplate={OSM_TILE_TEMPLATE} maximumZ={19} flipY={false} />
        {center ? (
          <>
            <Marker
              coordinate={{ latitude: center.latitude, longitude: center.longitude }}
              title="Your search area"
              description="Centre of your postcode filter"
              pinColor="#c62828"
            />
            <Circle
              center={{ latitude: center.latitude, longitude: center.longitude }}
              radius={2500}
              strokeColor="rgba(198,40,40,0.5)"
              fillColor="rgba(198,40,40,0.08)"
            />
          </>
        ) : null}
        {pins.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            title={p.title}
            description={p.subtitle}
            pinColor="#2E7D32"
          />
        ))}
      </MapView>
      <Text style={styles.attribution} numberOfLines={1}>
        © OpenStreetMap contributors
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 280,
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
  },
})
