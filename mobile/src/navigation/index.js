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

const NAVY   = '#0f172a'
const ACCENT = '#4f46e5'
const GREY   = '#94a3b8'

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: GREY,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
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
          tabBarActiveTintColor: '#ef4444',
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="My Report"
        component={DailyReportScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} /> }}
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
            <Stack.Screen
              name="LeadDetail"
              component={LeadDetailScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: NAVY },
                headerTintColor: '#ffffff',
                headerTitleStyle: { fontWeight: '700', fontSize: 16 },
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="CallSettings"
              component={CallSettingsScreen}
              options={{
                headerShown: true,
                title: 'Call Settings',
                headerStyle: { backgroundColor: NAVY },
                headerTintColor: '#ffffff',
                headerTitleStyle: { fontWeight: '700', fontSize: 16 },
                headerBackTitleVisible: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
