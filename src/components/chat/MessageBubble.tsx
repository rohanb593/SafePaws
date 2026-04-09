import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ChatMessage } from '../../types/Chat'
import { formatRelativeTime } from '../../utils/formatDate'

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.text, isOwn ? styles.textOwn : styles.textOther]}>
          {message.message}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>
            {formatRelativeTime(message.created_at)}
          </Text>
          {isOwn && (
            <Text style={[styles.tick, message.read_status ? styles.tickRead : styles.tickUnread]}>
              {' '}✓✓
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 3,
    marginHorizontal: 12,
    flexDirection: 'row',
  },
  rowOwn: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bubbleOwn: {
    backgroundColor: '#2E7D32',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  text: { fontSize: 15, lineHeight: 21 },
  textOwn: { color: '#fff' },
  textOther: { color: '#222' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  time: { fontSize: 11 },
  timeOwn: { color: 'rgba(255,255,255,0.7)' },
  timeOther: { color: '#999' },
  tick: { fontSize: 11 },
  tickRead: { color: '#90caf9' },
  tickUnread: { color: 'rgba(255,255,255,0.5)' },
})
