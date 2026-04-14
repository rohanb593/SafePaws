import React from 'react'
import { View, StyleSheet, type StyleProp, type TextStyle } from 'react-native'
import Icon from '@expo/vector-icons/MaterialIcons'
import { useSelector } from 'react-redux'

import { RootState } from '../../store'
import { useUnreadChatCount } from '../../hooks/useUnreadChatCount'

type Props = {
  color: string
  /** Default icon size from tab bar */
  size: number
  /** Optional override (e.g. admin uses 24/26 by focus) */
  iconSize?: number
  iconStyle?: StyleProp<TextStyle>
}

/**
 * Messages tab icon with a red dot when there are unread incoming messages.
 */
export default function ChatsTabBarIcon({ color, size, iconSize, iconStyle }: Props) {
  const userId = useSelector((s: RootState) => s.auth.user?.id)
  const unread = useUnreadChatCount(userId)
  const s = iconSize ?? size

  return (
    <View style={styles.wrap}>
      <Icon name="chat" size={s} color={color} style={iconStyle} />
      {unread > 0 ? <View style={styles.dot} accessibilityLabel="Unread messages" /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 1,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E53935',
    borderWidth: 2,
    borderColor: '#fff',
  },
})
