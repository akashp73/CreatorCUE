import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import LoginScreen from '../screens/LoginScreen'
import DashboardScreen from '../screens/DashboardScreen'
import LeadsScreen from '../screens/LeadsScreen'
import HotLeadsScreen from '../screens/HotLeadsScreen'
import TasksScreen from '../screens/TasksScreen'
import LeadDetailScreen from '../screens/LeadDetailScreen'
import DailyReportScreen from '../screens/DailyReportScreen'
import CallSettingsScreen from '../screens/CallSettingsScreen'
import CampaignsScreen from '../screens/CampaignsScreen'
import CallLogsScreen from '../screens/CallLogsScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const PURPLE = '#4a1a8a'
const MUTED  = '#9ca3af'
const WHITE  = '#ffffff'

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: WHITE,
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: PURPLE,
        tabBarInactiveTintColor: MUTED,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="My Leads"
        component={LeadsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Campaigns"
        component={CampaignsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="megaphone-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="CallLogs"
        component={CallLogsScreen}
        options={{
          tabBarLabel: 'Call Logs',
          tabBarIcon: ({ color, size }) => <Ionicons name="call-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="checkbox-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  )
}

export default function AppNavigator({ isAuthenticated }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="LeadDetail" component={LeadDetailScreen} />
            <Stack.Screen name="Hot Leads" component={HotLeadsScreen} />
            <Stack.Screen name="DailyReport" component={DailyReportScreen} />
            <Stack.Screen name="CallSettings" component={CallSettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
