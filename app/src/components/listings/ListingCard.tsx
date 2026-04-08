import React from 'react';
import { Pressable, Text, View, StyleSheet} from 'react-native';
import { Listing } from '../../types/Listing';
import { Card, Badge, Rating } from '../common';
import { formatPricePerHour } from '../../utils/formatPrice';

// Listing card component
// Displays: location, description, animal (if owner listing), price (if minder listing), created_at

interface listingCardProps {
    listing: Listing;    // the listing data to display
    onPress: () => void  // navigation handler
}

export const ListingCard: React.FC<listingCardProps> = ({ listing, onPress }) => {
  const isMinder = listing.listing_type === 'minder_listing';
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Badge 
            label={isMinder ? 'Minder' : 'Owner'} 
            variant={isMinder ? 'info' : 'success'} 
          />
          {listing.rating !== null && listing.rating > 0 && (
            <Rating value={listing.rating} size={14} />
          )}
        </View>
        
        <Text style={styles.location}>📍 {listing.location}</Text>
        
        {listing.animal && (
          <Text style={styles.animal}>🐾 {listing.animal}</Text>
        )}
        
        {listing.price && (
          <Text style={styles.price}>{formatPricePerHour(listing.price)}</Text>
        )}
        
        {listing.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {listing.description}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 12, marginHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  location: { fontSize: 14, color: '#666', marginBottom: 4 },
  animal: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32', marginBottom: 4 },
  description: { fontSize: 12, color: '#888', marginTop: 4 },
});