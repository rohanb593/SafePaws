import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Icon from '@expo/vector-icons/MaterialIcons'

import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen'
import SearchMinderScreen from '../screens/owner/SearchMinderScreen'
import ListingsScreen from '../screens/shared/ListingsScreen'
import ProfileScreen from '../screens/shared/ProfileScreen'
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

export type OwnerTabParamList = {
  Dashboard: undefined
  Search: undefined
  Listings: undefined
  Profile: undefined
}

export type OwnerStackParamList = {
  OwnerTabs: undefined
  MinderProfile: { minderId: string }
  BookingRequest: { minderId: string }
  BookingDetails: { bookingId: string }
  PetProfile: { petId: string }
  AddPet: undefined
  GPSTracking: { bookingId: string }
  Favourites: undefined
  LeaveReview: { bookingId: string; revieweeId: string }
  Chat: { threadId: string; otherUserId: string }
  CreateTicket: undefined
}

const Tab = createBottomTabNavigator<OwnerTabParamList>()
const Stack = createNativeStackNavigator<OwnerStackParamList>()

function OwnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Icon.glyphMap = 'home'

          if (route.name === 'Search') iconName = 'search'
          if (route.name === 'Listings') iconName = 'list'
          if (route.name === 'Profile') iconName = 'person'

          return <Icon name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} />
      <Tab.Screen name="Search" component={SearchMinderScreen} />
      <Tab.Screen name="Listings" component={ListingsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function OwnerNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OwnerTabs" component={OwnerTabs} options={{ headerShown: false }} />
      <Stack.Screen name="MinderProfile" component={MinderProfileScreen} />
      <Stack.Screen name="BookingRequest" component={BookingRequestScreen} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
      <Stack.Screen name="PetProfile" component={PetProfileScreen} />
      <Stack.Screen name="AddPet" component={AddPetScreen} />
      <Stack.Screen name="GPSTracking" component={GPSTrackingScreen} />
      <Stack.Screen name="Favourites" component={FavouritesScreen} />
      <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
    </Stack.Navigator>
  )
}
