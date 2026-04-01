import type { ComponentType } from 'react'
import { Platform } from 'react-native'

import type { PetLocationMapProps } from './PetLocationMap.types'

/**
 * OpenStreetMap on native (free tiles); web uses a lightweight fallback (no native maps module).
 */
export default function PetLocationMap(props: PetLocationMapProps) {
  if (Platform.OS === 'web') {
    const { default: Web } = require('./PetLocationMap.web') as {
      default: ComponentType<PetLocationMapProps>
    }
    return <Web {...props} />
  }
  const { default: Native } = require('./PetLocationMap.native') as {
    default: ComponentType<PetLocationMapProps>
  }
  return <Native {...props} />
}
