import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Icon from '@expo/vector-icons/MaterialIcons'

import ChatsTabBarIcon from '../components/navigation/ChatsTabBarIcon'
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen'
import SearchMinderScreen from '../screens/owner/SearchMinderScreen'
import ListingsScreen from '../screens/shared/ListingsScreen'
import ProfileScreen from '../screens/shared/ProfileScreen'
import ProfileDetailsScreen from '../screens/shared/ProfileDetailsScreen'
import ChatsListScreen from '../screens/shared/ChatsListScreen'
import MinderProfileScreen from '../screens/owner/MinderProfileScreen'
import BookingRequestScreen from '../screens/owner/BookingRequestScreen'
import BookingDetailsScreen from '../screens/owner/BookingDetailsScreen'
import PetProfileScreen from '../screens/owner/PetProfileScreen'
import AddPetScreen from '../screens/owner/AddPetScreen'
import GPSTrackingScreen from '../screens/owner/GPSTrackingScreen'
import FavouritesScreen from '../screens/owner/FavouritesScreen'
import LeaveReviewScreen from '../screens/owner/LeaveReviewScreen'
import ChatScreen from '../screens/shared/ChatScreen'
import CreateTicketScreen from '../screens/shared/CreateTicketScreen'
import MindersMapScreen from '../screens/owner/MindersMapScreen'
import MinderLocationMapScreen from '../screens/owner/MinderLocationMapScreen'
import JobDetailsScreen from '../screens/minder/JobDetailsScreen'
import SessionScreen from '../screens/minder/SessionScreen'
import PastBookingPeopleScreen from '../screens/shared/PastBookingPeopleScreen'
import SessionSummaryScreen from '../screens/shared/SessionSummaryScreen'

export type OwnerTabParamList = {
  Dashboard: undefined
  Search: undefined
  Listings: undefined
  Chats: undefined
}

export type OwnerStackParamList = {
  OwnerTabs: undefined
  Profile: undefined
  ProfileDetails: undefined
  MinderProfile: { minderId: string }
  BookingRequest: { minderId: string }
  BookingDetails: { bookingId: string }
  PetProfile: { petId: string }
  AddPet: undefined
  GPSTracking: { bookingId: string }
  Favourites: undefined
  LeaveReview: { bookingId: string; revieweeId: string }
  Chat: { threadId: string; otherUserId: string }
  MindersMap: undefined
  MinderLocationMap: { minderId: string }
  CreateTicket: undefined
  /** Accept/decline when someone books you as minder (same screen as Minder stack). */
  JobDetails: { bookingId: string }
  /** Live GPS session (minder) — must exist here when JobDetails is opened from this stack. */
  Session: { bookingId: string }
  /** After ending GPS session, or from booking details (summary stored on booking row). */
  SessionSummary: { bookingId: string; fromSessionEnd?: boolean }
  PastBookingPeople: undefined
}

const Tab = createBottomTabNavigator<OwnerTabParamList>()
const Stack = createNativeStackNavigator<OwnerStackParamList>()

function OwnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Chats') {
            return <ChatsTabBarIcon color={color} size={size} />
          }
          let iconName: keyof typeof Icon.glyphMap = 'home'

          if (route.name === 'Search') iconName = 'search'
          if (route.name === 'Listings') iconName = 'list'

          return <Icon name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} />
      <Tab.Screen name="Search" component={SearchMinderScreen} />
      <Tab.Screen name="Listings" component={ListingsScreen} />
      <Tab.Screen name="Chats" component={ChatsListScreen} options={{ title: 'Messages' }} />
    </Tab.Navigator>
  )
}

export default function OwnerNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OwnerTabs" component={OwnerTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen
        name="ProfileDetails"
        component={ProfileDetailsScreen}
        options={{ title: 'Account details' }}
      />
      <Stack.Screen name="MinderProfile" component={MinderProfileScreen} />
      <Stack.Screen name="BookingRequest" component={BookingRequestScreen} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
      <Stack.Screen name="PetProfile" component={PetProfileScreen} />
      <Stack.Screen name="AddPet" component={AddPetScreen} />
      <Stack.Screen name="GPSTracking" component={GPSTrackingScreen} />
      <Stack.Screen name="Favourites" component={FavouritesScreen} />
      <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="MindersMap" component={MindersMapScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MinderLocationMap" component={MinderLocationMapScreen} options={{ headerShown: false }} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} options={{ title: 'Booking request' }} />
      <Stack.Screen name="Session" component={SessionScreen} options={{ title: 'Active session', headerShown: false }} />
      <Stack.Screen
        name="SessionSummary"
        component={SessionSummaryScreen}
        options={{ title: 'Session summary', headerShown: false }}
      />
      <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
      <Stack.Screen
        name="PastBookingPeople"
        component={PastBookingPeopleScreen}
        options={{ title: 'Booking history' }}
      />
    </Stack.Navigator>
  )
}
