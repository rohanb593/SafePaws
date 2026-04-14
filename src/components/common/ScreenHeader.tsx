import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Icon from '@expo/vector-icons/MaterialIcons'
import { useNavigation } from '@react-navigation/native'

type Props = {
  title: string
}

/**
 * Same layout as OwnerDashboardScreen top bar: large left title + profile icon right.
 */
export default function ScreenHeader({ title }: Props) {
  const navigation = useNavigation()

  const openProfile = () => {
    const parent = navigation.getParent()
    if (parent) (parent as { navigate: (n: string) => void }).navigate('Profile')
    else (navigation as { navigate: (n: string) => void }).navigate('Profile')
  }

  return (
    <View style={styles.topBar}>
      <Text style={styles.screenTitle} numberOfLines={1}>
        {title}
      </Text>
      <Pressable
        onPress={openProfile}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
      >
        <Icon name="account-circle" size={34} color="#1f1f1f" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  screenTitle: {
    flex: 1,
    marginRight: 12,
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
  },
})
