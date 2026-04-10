import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Icon from '@expo/vector-icons/MaterialIcons'

import MinderDashboardScreen from '../screens/minder/MinderDashboardScreen'
import JobRequestsScreen from '../screens/minder/JobRequestsScreen'
import AvailabilityScreen from '../screens/minder/AvailabilityScreen'
import ProfileScreen from '../screens/shared/ProfileScreen'
import JobDetailsScreen from '../screens/minder/JobDetailsScreen'
import SessionScreen from '../screens/minder/SessionScreen'
import MinderProfileEditScreen from '../screens/minder/MinderProfileEditScreen'
import ChatScreen from '../screens/shared/ChatScreen'
import CreateTicketScreen from '../screens/shared/CreateTicketScreen'

export type MinderTabParamList = {
  Dashboard: undefined
  Jobs: undefined
  Availability: undefined
  Profile: undefined
}

export type MinderStackParamList = {
  MinderTabs: undefined
  JobDetails: { bookingId: string }
  Session: { bookingId: string }
  MinderProfileEdit: undefined
  Chat: { threadId: string; otherUserId: string }
  CreateTicket: undefined
}

const Tab = createBottomTabNavigator<MinderTabParamList>()
const Stack = createNativeStackNavigator<MinderStackParamList>()

function MinderTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Icon.glyphMap = 'home'

          if (route.name === 'Jobs') iconName = 'work'
          if (route.name === 'Availability') iconName = 'calendar-month'
          if (route.name === 'Profile') iconName = 'person'

          return <Icon name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={MinderDashboardScreen} />
      <Tab.Screen name="Jobs" component={JobRequestsScreen} />
      <Tab.Screen name="Availability" component={AvailabilityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function MinderNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MinderTabs" component={MinderTabs} options={{ headerShown: false }} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
      <Stack.Screen name="Session" component={SessionScreen} />
      <Stack.Screen name="MinderProfileEdit" component={MinderProfileEditScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
    </Stack.Navigator>
  )
}
