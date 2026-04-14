import React from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Icon from '@expo/vector-icons/MaterialIcons'

import ChatsTabBarIcon from '../components/navigation/ChatsTabBarIcon'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen'
import TicketQueueScreen from '../screens/admin/TicketQueueScreen'
import TicketDetailScreen from '../screens/admin/TicketDetailScreen'
import UserManagementScreen from '../screens/admin/UserManagementScreen'
import ProfileScreen from '../screens/shared/ProfileScreen'
import ProfileDetailsScreen from '../screens/shared/ProfileDetailsScreen'
import ChatScreen from '../screens/shared/ChatScreen'
import ChatsListScreen from '../screens/shared/ChatsListScreen'
import { RootState } from '../store'

export type AdminTabParamList = {
  Tickets: undefined
  Chats: undefined
  Dashboard: undefined
  Users: undefined
}

export type AdminStackParamList = {
  AdminTabs: undefined
  TicketDetail: { ticketId: string }
  Chat: { threadId: string; otherUserId: string }
  Profile: undefined
  ProfileDetails: undefined
}

const Tab = createBottomTabNavigator<AdminTabParamList>()
const Stack = createNativeStackNavigator<AdminStackParamList>()

const styles = StyleSheet.create({
  tabIconWrap: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

function StaffChatsTab() {
  return <ChatsListScreen variant="staff" hideScreenTitle />
}

function AdminTabs() {
  const role = useSelector((state: RootState) => state.auth.role)
  const insets = useSafeAreaInsets()
  const tabBarBottom = Math.max(insets.bottom, 10)

  return (
    <Tab.Navigator
      initialRouteName="Tickets"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1b4332',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: '#e2e8f0',
          paddingTop: 6,
          paddingBottom: tabBarBottom,
          minHeight: 52 + tabBarBottom,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
            },
            android: { elevation: 12 },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.15,
          marginTop: 2,
          marginBottom: Platform.OS === 'ios' ? 0 : 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarIcon: ({ color, focused }) => {
          if (route.name === 'Chats') {
            const iconSize = focused ? 26 : 24
            const chatAlign =
              Platform.OS === 'ios'
                ? ({ transform: [{ translateY: 4 }] } as const)
                : ({ transform: [{ translateY: 3 }] } as const)
            return (
              <View style={styles.tabIconWrap}>
                <ChatsTabBarIcon
                  color={color}
                  size={24}
                  iconSize={iconSize}
                  iconStyle={chatAlign}
                />
              </View>
            )
          }
          let iconName: keyof typeof Icon.glyphMap = 'confirmation-number'
          if (route.name === 'Dashboard') iconName = 'insights'
          if (route.name === 'Users') iconName = 'group'
          const iconSize = focused ? 26 : 24
          return (
            <View style={styles.tabIconWrap}>
              <Icon name={iconName} size={iconSize} color={color} />
            </View>
          )
        },
      })}
    >
      <Tab.Screen
        name="Tickets"
        component={TicketQueueScreen}
        options={{ title: 'Tickets', tabBarLabel: 'Tickets' }}
      />
      <Tab.Screen
        name="Chats"
        component={StaffChatsTab}
        options={{ title: 'Messages', tabBarLabel: 'Messages' }}
      />
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Overview' }}
      />
      <Tab.Screen
        name="Users"
        component={UserManagementScreen}
        options={{
          title: 'Users',
          tabBarButton: role === 'admin' ? undefined : () => null,
        }}
      />
    </Tab.Navigator>
  )
}

export default function AdminNavigator() {
  return (
    <Stack.Navigator initialRouteName="AdminTabs">
      <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
      <Stack.Screen name="TicketDetail" component={TicketDetailScreen} options={{ title: 'Ticket' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
      <Stack.Screen
        name="Profile"
        options={{ title: 'Profile', headerBackTitle: 'Back' }}
      >
        {() => <ProfileScreen hideTopSafeArea />}
      </Stack.Screen>
      <Stack.Screen
        name="ProfileDetails"
        options={{ title: 'Account details', headerBackTitle: 'Back' }}
      >
        {() => <ProfileDetailsScreen hideTopSafeArea />}
      </Stack.Screen>
    </Stack.Navigator>
  )
}
