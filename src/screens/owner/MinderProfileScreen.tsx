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

import React, { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import Avatar from '../../components/common/Avatar'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Rating from '../../components/common/Rating'
import { supabase } from '../../lib/supabase'
import { RootState } from '../../store'
import { Listing } from '../../types/Listing'
import { Review } from '../../types/Review'
import { User } from '../../types/User'

interface ReviewWithReviewer extends Review {
  reviewer?: { display_name: string; username: string } | null
}

export default function MinderProfileScreen({ navigation, route }: any) {
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id)
  const minderId: string = route.params?.minderId

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<User | null>(null)
  const [listing, setListing] = useState<Listing | null>(null)
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([])
  const [isFavourited, setIsFavourited] = useState(false)

  const threadId = useMemo(() => {
    if (!currentUserId) return ''
    return [currentUserId, minderId].sort().join('_')
  }, [currentUserId, minderId])

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const [{ data: profileData }, { data: listingData }, { data: reviewData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', minderId).single(),
        supabase
          .from('listings')
          .select('*')
          .eq('user_id', minderId)
          .eq('listing_type', 'minder_listing')
          .maybeSingle(),
        supabase
          .from('reviews')
          .select('*, reviewer:reviewer_id(display_name, username)')
          .eq('reviewee_id', minderId)
          .order('date', { ascending: false }),
      ])

      setProfile((profileData as User) ?? null)
      setListing((listingData as Listing) ?? null)
      setReviews((reviewData as ReviewWithReviewer[]) ?? [])

      if (currentUserId) {
        const { data: favourite } = await supabase
          .from('favourites')
          .select('id')
          .eq('owner_id', currentUserId)
          .eq('minder_id', minderId)
          .maybeSingle()
        setIsFavourited(Boolean(favourite))
      }

      setLoading(false)
    }

    load()
  }, [currentUserId, minderId])

  const toggleFavourite = async () => {
    if (!currentUserId) return

    if (isFavourited) {
      const { error } = await supabase
        .from('favourites')
        .delete()
        .eq('owner_id', currentUserId)
        .eq('minder_id', minderId)
      if (!error) setIsFavourited(false)
      return
    }

    const { error } = await supabase.from('favourites').insert({
      owner_id: currentUserId,
      minder_id: minderId,
    })
    if (!error) setIsFavourited(true)
  }

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text>Unable to load minder profile.</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar name={profile.display_name || profile.username} size={64} />
        <Text style={styles.name}>{profile.display_name || profile.username}</Text>
        <Text style={styles.location}>{profile.location || 'Location not set'}</Text>
        <Rating value={profile.ratings ?? 0} readonly />
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Experience</Text>
        <Text style={styles.bodyText}>{profile.experience || 'No experience details provided yet.'}</Text>
      </Card>

      {listing ? (
        <Card>
          <Text style={styles.sectionTitle}>Listing Details</Text>
          <Text style={styles.bodyText}>Animals: {listing.animal || 'Any'}</Text>
          <Text style={styles.bodyText}>Price: {listing.price ? `£${listing.price} / hr` : 'Not set'}</Text>
          <Text style={styles.bodyText}>Availability: {listing.time || 'Not set'}</Text>
          <Text style={styles.bodyText}>{listing.description || 'No description'}</Text>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {reviews.length === 0 ? <Text style={styles.bodyText}>No reviews yet.</Text> : null}
        {reviews.map((review) => (
          <View key={review.id} style={styles.reviewItem}>
            <View style={styles.reviewTop}>
              <Text style={styles.reviewer}>
                {review.reviewer?.display_name || review.reviewer?.username || 'User'}
              </Text>
              <Rating value={review.rating} size={14} readonly />
            </View>
            <Text style={styles.bodyText}>{review.comment || 'No comment'}</Text>
          </View>
        ))}
      </Card>

      <Button label={isFavourited ? 'Remove Favourite' : 'Save to Favourites'} onPress={toggleFavourite} />
      <Button
        label="Book Now"
        onPress={() => navigation.navigate('BookingRequest', { minderId })}
      />
      <Button
        label="Message"
        variant="secondary"
        onPress={() => {
          if (!threadId || !currentUserId) {
            Alert.alert('Please sign in to start chat.')
            return
          }
          navigation.navigate('Chat', { threadId, otherUserId: minderId })
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '700',
  },
  location: {
    color: '#666',
    marginVertical: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  bodyText: {
    color: '#374151',
    lineHeight: 20,
  },
  reviewItem: {
    borderTopWidth: 1,
    borderTopColor: '#eceff1',
    paddingTop: 10,
    marginTop: 10,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewer: {
    fontWeight: '600',
  },
})
