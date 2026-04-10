import type { StyleProp, ViewStyle } from 'react-native'

export type MapPin = {
  id: string
  latitude: number
  longitude: number
  title: string
  subtitle?: string
  /** 'minder' | 'search' | 'me' */
  variant?: 'minder' | 'search' | 'me'
}

export interface MindersMapViewProps {
  pins: MapPin[]
  /** Search / filter postcode centre (distinct marker). */
  center?: { latitude: number; longitude: number } | null
  showUserLocation?: boolean
  style?: StyleProp<ViewStyle>
}
