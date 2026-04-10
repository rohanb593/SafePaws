import React from 'react'
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Avatar from '../common/Avatar'
import Card from '../common/Card'
import Rating from '../common/Rating'
import { Listing } from '../../types/Listing'
import { User } from '../../types/User'
import { formatPricePerHour } from '../../utils/formatPrice'

// Pet Minder summary card
//
// Props:
//   minder: PetMinder          — minder profile data
//   listing?: MinderListing    — associated listing (optional)
//   onPress: () => void        — navigation handler
//
// Displays: Avatar, username, Rating (ratings), pricing_rate, animal_tags (Badge list), location

interface MinderCardProps {
  minder: User & { listing?: Listing }
  onPress: () => void
  isFavourited?: boolean
  onToggleFavourite?: () => void
}

export default function MinderCard({
  minder,
  onPress,
  isFavourited = false,
  onToggleFavourite,
}: MinderCardProps) {
  const listingPrice = typeof minder.listing?.price === 'number' ? formatPricePerHour(minder.listing.price) : null

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Avatar name={minder.display_name || minder.username} size={46} />

          <View style={styles.info}>
            <Text style={styles.name}>{minder.display_name || minder.username}</Text>
            <Text style={styles.meta}>{minder.location || 'Location not set'}</Text>
            <Rating value={minder.ratings ?? 0} readonly />
            {listingPrice ? <Text style={styles.price}>{listingPrice}</Text> : null}
          </View>

          <TouchableOpacity onPress={onToggleFavourite} hitSlop={8} style={styles.heartButton}>
            <Text style={styles.heart}>{isFavourited ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
