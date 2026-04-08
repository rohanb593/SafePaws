import React from 'react';
import { Pressable, View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Avatar, Rating } from '../common';
import { formatPricePerHour } from '../../utils/formatPrice';
import { User } from '../../types/User';
import { Listing } from '../../types/Listing';

// Pet Minder summary card
//
// Props:
//   minder: PetMinder          — minder profile data
//   listing?: MinderListing    — associated listing (optional)
//   onPress: () => void        — navigation handler
//
// Displays: Avatar, username, Rating (ratings), pricing_rate, animal_tags (Badge list), location

interface MinderCardProps {
  minder: User & { listing?: Listing };
  onPress: () => void;
  isFavourited?: boolean;
  onToggleFavourite?: () => void;
}

export const MinderCard: React.FC<MinderCardProps> = ({
  minder,
  onPress,
  isFavourited,
  onToggleFavourite,
}) => {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <TouchableOpacity style={styles.favouriteButton} onPress={onToggleFavourite}>
          <Text style={[styles.heart, isFavourited && styles.heartFilled]}>
            {isFavourited ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Avatar uri={null} name={minder.display_name || minder.username} size={50} />
          <View style={styles.info}>
            <Text style={styles.name}>{minder.display_name || minder.username}</Text>
            <Text style={styles.location}>📍 {minder.location || 'Location not set'}</Text>
            <Rating value={minder.ratings || 0} size={14} />
          </View>
          {minder.listing?.price && (
            <Text style={styles.price}>{formatPricePerHour(minder.listing.price)}</Text>
          )}
        </View>
      </Card>
    </Pressable>
  );
};


const styles = StyleSheet.create({
  card: { marginBottom: 12, marginHorizontal: 16 },
  favouriteButton: { position: 'absolute', top: 12, right: 12, zIndex: 1, padding: 4 },
  heart: { fontSize: 24, color: '#999' },
  heartFilled: { color: '#e91e63' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  location: { fontSize: 12, color: '#666', marginBottom: 2 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
});
