import type { ComponentType } from 'react'
import { Platform } from 'react-native'

import type { MindersMapViewProps } from './MindersMapView.types'

export default function MindersMapView(props: MindersMapViewProps) {
  if (Platform.OS === 'web') {
    const { default: Web } = require('./MindersMapView.web') as {
      default: ComponentType<MindersMapViewProps>
    }
    return <Web {...props} />
  }
  const { default: Native } = require('./MindersMapView.native') as {
    default: ComponentType<MindersMapViewProps>
  }
  return <Native {...props} />
}
