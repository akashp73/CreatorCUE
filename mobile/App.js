import React, { useEffect, useState } from 'react'
import { StatusBar, View, Text, ActivityIndicator } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import { devicesApi } from './src/services/api'
import useAuthStore from './src/store/authStore'
import AppNavigator from './src/navigation'

// Configure how notifications appear when app is foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
      staleTime: 60000,      // 1 min — don't refetch while fresh
      gcTime: 5 * 60000,     // keep in cache 5 min after unmount
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
})

async function registerForPushNotifications() {
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-project-id', // Replace with actual EAS project ID
  }).catch(() => null)

  return token?.data || null
}

function Root() {
  const { user, loading, init } = useAuthStore()

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (!user) return

    // Register push token
    registerForPushNotifications().then(token => {
      if (token) {
        devicesApi.register({ token, platform: 'android' }).catch(() => {})
      }
    })

    // Handle notification tap (background/quit)
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data
      console.log('[Push] Tapped notification:', data)
      // Navigation to lead or task handled via NavigationContainer ref in real app
    })

    return () => sub.remove()
  }, [user])

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4a1a8a' }}>
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 16, fontSize: 14, fontWeight: '600' }}>EduCRM</Text>
      </View>
    )
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1B2B4B" />
      <AppNavigator isAuthenticated={!!user} />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  )
}
