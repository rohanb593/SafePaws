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
import { formatListingAvailabilityDisplay } from '../../types/availability'
import { Listing } from '../../types/Listing'
import { Review } from '../../types/Review'
import { User } from '../../types/User'
import { dmThreadId } from '../../utils/threadId'

interface ReviewWithReviewer extends Review {
  reviewer?: { display_name: string; username: string } | null
}

export default function MinderProfileScreen({ navigation, route }: any) {
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id)
  const minderId: string = route.params?.minderId
  /** When set (e.g. from search), show this listing — not only the minder's newest listing. */
  const listingIdFromRoute: string | undefined = route.params?.listingId

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<User | null>(null)
  const [listing, setListing] = useState<Listing | null>(null)
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([])
  const [isFavourited, setIsFavourited] = useState(false)

  const threadId = useMemo(() => {
    if (!currentUserId || !minderId) return ''
    return dmThreadId(currentUserId, minderId)
  }, [currentUserId, minderId])

  const canShowMap = useMemo(
    () => Boolean(listing?.postcode?.trim() || profile?.location?.trim()),
    [listing?.postcode, profile?.location]
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const listingQuery = listingIdFromRoute
        ? supabase
            .from('listings')
            .select('*')
            .eq('id', listingIdFromRoute)
            .eq('user_id', minderId)
            .maybeSingle()
        : supabase
            .from('listings')
            .select('*')
            .eq('user_id', minderId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

      const [{ data: profileData }, { data: listingData }, { data: reviewData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', minderId).single(),
        listingQuery,
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
  }, [currentUserId, minderId, listingIdFromRoute])

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
        {listing?.postcode ? <Text style={styles.postcodeLine}>Postcode: {listing.postcode}</Text> : null}
        <Rating value={profile.ratings ?? 0} readonly />
        <View style={styles.locationBtnWrap}>
          <Button
            label="Show location on map"
            variant="secondary"
            onPress={() =>
              navigation.navigate('MinderLocationMap', {
                minderId,
                ...(listing?.id ? { listingId: listing.id } : {}),
              })
            }
            disabled={!canShowMap}
          />
        </View>
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
          <Text style={styles.bodyText}>
            Availability: {formatListingAvailabilityDisplay(listing)}
          </Text>
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
  postcodeLine: {
    fontSize: 14,
    color: '#455a64',
    fontWeight: '600',
    marginBottom: 6,
  },
  locationBtnWrap: {
    alignSelf: 'stretch',
    marginTop: 10,
    paddingHorizontal: 8,
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
