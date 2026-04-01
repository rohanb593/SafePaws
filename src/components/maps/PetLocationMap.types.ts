import type { StyleProp, ViewStyle } from 'react-native'

export interface PetLocationMapProps {
  latitude: number
  longitude: number
  markerTitle?: string
  style?: StyleProp<ViewStyle>
}
