import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Card from '../common/Card'
import Badge from '../common/Badge'
import Rating from '../common/Rating'
import { formatPricePerHour } from '../../utils/formatPrice'
import { formatListingAvailabilityDisplay } from '../../types/availability'
import { Listing } from '../../types/Listing'

// Listing card component
//
// Props:
//   listing: Listing    — the listing data to display
//   onPress: () => void — navigation handler
//
// Displays: location, description, animals, availability, price, rating

interface ListingCardProps {
  listing: Listing
  onPress: () => void
}

export default function ListingCard({ listing, onPress }: ListingCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Badge label="Listing" variant="info" />
          <View style={styles.locationBlock}>
            <Text style={styles.location}>{listing.location}</Text>
            {listing.postcode ? <Text style={styles.postcode}>{listing.postcode}</Text> : null}
          </View>
        </View>

        <Text style={styles.animal}>{listing.animal || 'All animals'}</Text>
        <Text style={styles.availability}>{formatListingAvailabilityDisplay(listing)}</Text>
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
  locationBlock: {
    marginLeft: 8,
    flex: 1,
    alignItems: 'flex-end',
  },
  location: {
    color: '#555',
    fontSize: 13,
    textAlign: 'right',
  },
  postcode: {
    color: '#667085',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'right',
    fontWeight: '600',
  },
  animal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  availability: {
    fontSize: 13,
    color: '#546e7a',
    marginBottom: 8,
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
