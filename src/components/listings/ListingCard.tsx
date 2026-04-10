import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Card from '../common/Card'
import Badge from '../common/Badge'
import Rating from '../common/Rating'
import { formatPricePerHour } from '../../utils/formatPrice'
import { Listing } from '../../types/Listing'

// Listing card component
//
// Props:
//   listing: Listing    — the listing data to display
//   onPress: () => void — navigation handler
//
// Displays: location, description, animal (if owner listing), price (if minder listing), created_at

interface ListingCardProps {
  listing: Listing
  onPress: () => void
}

export default function ListingCard({ listing, onPress }: ListingCardProps) {
  const isMinder = listing.listing_type === 'minder_listing'

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Badge label={isMinder ? 'Minder' : 'Owner'} variant={isMinder ? 'info' : 'success'} />
          <Text style={styles.location}>{listing.location}</Text>
        </View>

        <Text style={styles.animal}>{listing.animal || 'Any animal'}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {listing.description || 'No description'}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.price}>
            {typeof listing.price === 'number' ? formatPricePerHour(listing.price) : 'Price not set'}
          </Text>
          <Rating value={listing.rating ?? 0} readonly />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    color: '#555',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    textAlign: 'right',
  },
  animal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontWeight: '700',
    color: '#2E7D32',
  },
})
