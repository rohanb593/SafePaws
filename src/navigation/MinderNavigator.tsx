import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Icon from '@expo/vector-icons/MaterialIcons'

import ChatsTabBarIcon from '../components/navigation/ChatsTabBarIcon'
import MinderDashboardScreen from '../screens/minder/MinderDashboardScreen'
import JobRequestsScreen from '../screens/minder/JobRequestsScreen'
import AvailabilityScreen from '../screens/minder/AvailabilityScreen'
import ProfileScreen from '../screens/shared/ProfileScreen'
import ProfileDetailsScreen from '../screens/shared/ProfileDetailsScreen'
import ChatsListScreen from '../screens/shared/ChatsListScreen'
import ListingsScreen from '../screens/shared/ListingsScreen'
import JobDetailsScreen from '../screens/minder/JobDetailsScreen'
import SessionScreen from '../screens/minder/SessionScreen'
import MinderProfileEditScreen from '../screens/minder/MinderProfileEditScreen'
import ChatScreen from '../screens/shared/ChatScreen'
import CreateTicketScreen from '../screens/shared/CreateTicketScreen'
import PastBookingPeopleScreen from '../screens/shared/PastBookingPeopleScreen'
import SessionSummaryScreen from '../screens/shared/SessionSummaryScreen'
import PeerProfileScreen from '../screens/shared/PeerProfileScreen'

export type MinderTabParamList = {
  Dashboard: undefined
  Jobs: undefined
  Availability: undefined
  Listings: undefined
  Chats: undefined
}

export type MinderStackParamList = {
  MinderTabs: undefined
  Profile: undefined
  ProfileDetails: undefined
  JobDetails: { bookingId: string }
  Session: { bookingId: string }
  SessionSummary: { bookingId: string; fromSessionEnd?: boolean }
  MinderProfileEdit: undefined
  Chat: { threadId: string; otherUserId: string }
  CreateTicket: undefined
  PastBookingPeople: undefined
  PeerProfile: { userId: string }
}

const Tab = createBottomTabNavigator<MinderTabParamList>()
const Stack = createNativeStackNavigator<MinderStackParamList>()

function MinderTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Chats') {
            return <ChatsTabBarIcon color={color} size={size} />
          }
          let iconName: keyof typeof Icon.glyphMap = 'home'

          if (route.name === 'Jobs') iconName = 'work'
          if (route.name === 'Availability') iconName = 'calendar-month'
          if (route.name === 'Listings') iconName = 'list'

          return <Icon name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={MinderDashboardScreen} />
      <Tab.Screen name="Jobs" component={JobRequestsScreen} />
      <Tab.Screen name="Availability" component={AvailabilityScreen} />
      <Tab.Screen name="Listings" component={ListingsScreen} />
      <Tab.Screen name="Chats" component={ChatsListScreen} options={{ title: 'Messages' }} />
    </Tab.Navigator>
  )
}

export default function MinderNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MinderTabs" component={MinderTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen
        name="ProfileDetails"
        component={ProfileDetailsScreen}
        options={{ title: 'Account details' }}
      />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
      <Stack.Screen name="Session" component={SessionScreen} />
      <Stack.Screen
        name="SessionSummary"
        component={SessionSummaryScreen}
        options={{ title: 'Session summary', headerShown: false }}
      />
      <Stack.Screen name="MinderProfileEdit" component={MinderProfileEditScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
      <Stack.Screen
        name="PastBookingPeople"
        component={PastBookingPeopleScreen}
        options={{ title: 'Booking history' }}
      />
      <Stack.Screen name="PeerProfile" component={PeerProfileScreen} options={{ title: 'Pet owner' }} />
    </Stack.Navigator>
  )
}
