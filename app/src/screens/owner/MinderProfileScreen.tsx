import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Avatar, Rating, LoadingSpinner, Card, Badge } from '../../components/common';
import { supabase } from '../../lib/supabase';
import { formatPricePerHour } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';

// Read-only Pet Minder profile (RQ16)
//
// Props: minderID (from navigation params)
// Fetches:
//   supabase.from('profiles').select('*, pet_minder_profiles(*)').eq('id', minderID)
//   supabase.from('reviews').select('*').eq('reviewee_id', minderID)
// Displays: experience, animal_tags, pricing_rate, ratings, certification_titles, Review list
//
// Elements:
//   Avatar, Rating, Badge list (animal_tags), Review cards
//   Button ('Request Booking' → BookingRequestScreen)
//   Button ('Save to Favourites' → upsert into favourites table, RQ48)
//   Button ('Message' → ChatScreen)

export const MinderProfileScreen = ({ route, navigation }: any) => {
  const { minderId } = route.params;
  const [minder, setMinder] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isFavourited, setIsFavourited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadProfile = async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const [profileRes, listingRes, reviewsRes, favRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', minderId).single(),
        supabase.from('listings').select('*').eq('user_id', minderId).eq('listing_type', 'minder').maybeSingle(),
        supabase.from('reviews').select('*, reviewer:reviewer_id(display_name, username)').eq('reviewee_id', minderId).order('date', { ascending: false }),
        supabase.from('favourites').select('id').eq('owner_id', currentUserId).eq('minder_id', minderId).maybeSingle(),
      ]);

      setMinder(profileRes.data);
      setListing(listingRes.data);
      setReviews(reviewsRes.data || []);
      setIsFavourited(!!favRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavourite = async () => {
    if (!currentUserId) return;
    
    if (isFavourited) {
      await supabase.from('favourites').delete().eq('owner_id', currentUserId).eq('minder_id', minderId);
      setIsFavourited(false);
    } else {
      await supabase.from('favourites').insert({ owner_id: currentUserId, minder_id: minderId });
      setIsFavourited(true);
    }
  };

  const handleBookNow = () => {
    navigation.navigate('BookingRequest', { minderId });
  };

  const handleMessage = () => {
    const threadId = [currentUserId, minderId].sort().join('_');
    navigation.navigate('Chat', { threadId, otherUserId: minderId });
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!minder) return <Text>Minder not found</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleToggleFavourite} style={styles.heartButton}>
          <Text style={[styles.heart, isFavourited && styles.heartFilled]}>{isFavourited ? '♥' : '♡'}</Text>
        </TouchableOpacity>
        <Avatar uri={null} name={minder.display_name || minder.username} size={80} />
        <Text style={styles.name}>{minder.display_name || minder.username}</Text>
        <Text style={styles.location}>📍 {minder.location || 'Location not set'}</Text>
        <Rating value={minder.ratings || 0} size={20} />
      </View>

      {minder.experience && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <Text style={styles.experience}>{minder.experience}</Text>
        </Card>
      )}

      {listing && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {listing.animal && <Text>🐾 Animals: {listing.animal}</Text>}
          {listing.price && <Text style={styles.price}>💰 {formatPricePerHour(listing.price)}</Text>}
          {listing.time && <Text>⏰ Available: {listing.time}</Text>}
        </Card>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.bookButton]} onPress={handleBookNow}>
          <Text style={styles.buttonText}>Book Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.messageButton]} onPress={handleMessage}>
          <Text style={styles.buttonText}>Message</Text>
        </TouchableOpacity>
      </View>

      {reviews.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.map(review => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{review.reviewer?.display_name || review.reviewer?.username}</Text>
                <Text style={styles.reviewDate}>{formatDate(review.date)}</Text>
              </View>
              <Rating value={review.rating} size={14} />
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#fff', marginBottom: 12 },
  heartButton: { position: 'absolute', top: 16, right: 16, padding: 8, zIndex: 1 },
  heart: { fontSize: 28, color: '#999' },
  heartFilled: { color: '#e91e63' },
  name: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  location: { fontSize: 14, color: '#666', marginVertical: 4 },
  section: { marginBottom: 12, marginHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  experience: { fontSize: 14, color: '#444', lineHeight: 20 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32', marginTop: 8 },
  buttonRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  bookButton: { backgroundColor: '#007AFF' },
  messageButton: { backgroundColor: '#34C759' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  reviewItem: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewerName: { fontWeight: '500' },
  reviewDate: { fontSize: 12, color: '#888' },
  reviewComment: { fontSize: 14, color: '#555', marginTop: 8 },
});