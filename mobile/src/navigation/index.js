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

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const BG     = '#0f172a'
const ACCENT = '#6366f1'
const MUTED  = '#475569'
const ACTIVE = '#a5b4fc'

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f1a2b',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: ACTIVE,
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
        name="Hot Leads"
        component={HotLeadsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="flame-outline" size={size} color={color} />,
          tabBarActiveTintColor: '#f87171',
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle-outline" size={size} color={color} /> }}
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
            <Stack.Screen name="DailyReport" component={DailyReportScreen} />
            <Stack.Screen name="CallSettings" component={CallSettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
