import React from 'react'
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Icon from '@expo/vector-icons/MaterialIcons'
import Avatar from '../common/Avatar'
import Card from '../common/Card'
import Rating from '../common/Rating'
import { formatListingAvailabilityDisplay } from '../../types/availability'
import { Listing } from '../../types/Listing'
import { User } from '../../types/User'
import { formatPricePerHour } from '../../utils/formatPrice'

// Pet Minder summary card
//
// Props:
//   minder: PetMinder          — minder profile data
//   listing?: Listing          — associated listing (optional)
//   onPress: () => void        — navigation handler
//
// Displays: Avatar, username, Rating (ratings), pricing_rate, animal_tags (Badge list), location

interface MinderCardProps {
  minder: User & { listing?: Listing }
  onPress: () => void
  isFavourited?: boolean
  onToggleFavourite?: () => void
  /** Shown when search was sorted by postcode proximity. */
  distanceKm?: number
  /** Listing postcode (search result). */
  listingPostcode?: string | null
  onMessage?: () => void
}

export default function MinderCard({
  minder,
  onPress,
  isFavourited = false,
  onToggleFavourite,
  distanceKm,
  listingPostcode,
  onMessage,
}: MinderCardProps) {
  const listingPrice = typeof minder.listing?.price === 'number' ? formatPricePerHour(minder.listing.price) : null

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Pressable onPress={onPress} style={styles.mainPress}>
          <Avatar name={minder.display_name || minder.username} size={46} />

          <View style={styles.info}>
            <Text style={styles.name}>{minder.display_name || minder.username}</Text>
            <Text style={styles.meta}>{minder.location || 'Location not set'}</Text>
            {listingPostcode ? <Text style={styles.postcode}>Postcode: {listingPostcode}</Text> : null}
            {distanceKm != null && Number.isFinite(distanceKm) ? (
              <Text style={styles.distance}>~{distanceKm.toFixed(1)} km from your search</Text>
            ) : null}
            {minder.listing ? (
              <Text style={styles.listingAvail} numberOfLines={1}>
                {formatListingAvailabilityDisplay(minder.listing)}
              </Text>
            ) : null}
            <Rating value={minder.ratings ?? 0} readonly />
            {listingPrice ? <Text style={styles.price}>{listingPrice}</Text> : null}
          </View>
        </Pressable>

        <View style={styles.actions}>
          {onMessage ? (
            <TouchableOpacity onPress={onMessage} hitSlop={8} style={styles.iconBtn} accessibilityLabel="Message">
              <Icon name="chat-bubble-outline" size={24} color="#1565c0" />
            </TouchableOpacity>
          ) : null}
          {onToggleFavourite ? (
            <TouchableOpacity onPress={onToggleFavourite} hitSlop={8} style={styles.iconBtn}>
              <Text style={styles.heart}>{isFavourited ? '♥' : '♡'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  mainPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  iconBtn: {
    padding: 6,
    marginBottom: 2,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 2,
  },
  meta: {
    color: '#666',
    marginBottom: 4,
  },
  postcode: {
    fontSize: 12,
    color: '#37474f',
    fontWeight: '600',
    marginBottom: 2,
  },
  distance: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 4,
  },
  listingAvail: {
    color: '#546e7a',
    fontSize: 12,
    marginBottom: 6,
  },
  price: {
    marginTop: 6,
    color: '#2E7D32',
    fontWeight: '700',
  },
  heartButton: {
    padding: 4,
    marginLeft: 8,
  },
  heart: {
    fontSize: 22,
    color: '#d32f2f',
  },
})
