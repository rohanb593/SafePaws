import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen'
import TicketQueueScreen from '../screens/admin/TicketQueueScreen'
import TicketDetailScreen from '../screens/admin/TicketDetailScreen'
import UserManagementScreen from '../screens/admin/UserManagementScreen'

export type AdminStackParamList = {
  AdminDashboard: undefined
  TicketQueue: undefined
  TicketDetail: { ticketId: string }
  UserManagement: undefined
}

const Stack = createNativeStackNavigator<AdminStackParamList>()

export default function AdminNavigator() {
  return (
    <Stack.Navigator initialRouteName="AdminDashboard">
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="TicketQueue" component={TicketQueueScreen} />
      <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
    </Stack.Navigator>
  )
}
