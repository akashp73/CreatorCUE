import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import LoginScreen from '../screens/LoginScreen'
import DashboardScreen from '../screens/DashboardScreen'
import LeadsScreen from '../screens/LeadsScreen'
import HotLeadsScreen from '../screens/HotLeadsScreen'
import TasksScreen from '../screens/TasksScreen'
import LeadDetailScreen from '../screens/LeadDetailScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const NAVY = '#1B2B4B'
const SAFFRON = '#F6AD2B'
const GREY = '#9CA3AF'

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: NAVY, borderTopColor: '#2D3748', height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: SAFFRON,
        tabBarInactiveTintColor: GREY,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="My Leads"
        component={LeadsScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Hot Leads"
        component={HotLeadsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="fire" size={size} color={color} />,
          tabBarActiveTintColor: '#E53E3E',
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={size} color={color} /> }}
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
                headerTintColor: '#FFFFFF',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
