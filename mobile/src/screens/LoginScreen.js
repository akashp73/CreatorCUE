import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import useAuthStore from '../store/authStore'

const NAVY = '#1B2B4B'
const SAFFRON = '#F6AD2B'

export default function LoginScreen() {
  const [email, setEmail] = useState('admin@demo.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const login = useAuthStore(s => s.login)

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Email and password are required')
    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="school" size={36} color="white" />
          </View>
          <Text style={styles.appName}>EduCRM</Text>
          <Text style={styles.appSub}>Education CRM Platform</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in to your account</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="admin@demo.com"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passWrap}>
              <TextInput
                style={[styles.input, { paddingRight: 48 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPass}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <MaterialCommunityIcons name={showPass ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="white" size="small" />
              : <Text style={styles.btnText}>Sign In</Text>
            }
          </TouchableOpacity>

          {/* Demo hint */}
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Demo Credentials</Text>
            <Text style={styles.demoText}>Email: admin@demo.com</Text>
            <Text style={styles.demoText}>Password: Demo@1234</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 72, height: 72, borderRadius: 20, backgroundColor: SAFFRON, alignItems: 'center', justifyContent: 'center', marginBottom: 16, elevation: 8, shadowColor: SAFFRON, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  appName: { fontSize: 28, fontWeight: 'bold', color: SAFFRON },
  appSub: { fontSize: 14, color: '#93C5FD', marginTop: 4 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 24, elevation: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937', backgroundColor: '#FAFAFA' },
  passWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 14, top: 12 },
  btn: { backgroundColor: SAFFRON, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, elevation: 4, shadowColor: SAFFRON, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  demoBox: { marginTop: 16, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12 },
  demoTitle: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
  demoText: { fontSize: 12, color: '#6B7280', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
})
