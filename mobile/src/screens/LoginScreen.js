import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import useAuthStore from '../store/authStore'

const NAVY   = '#0f172a'
const ACCENT = '#4f46e5'

export default function LoginScreen() {
  const [email, setEmail]       = useState('admin@demo.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const login = useAuthStore(s => s.login)

  const handleLogin = async () => {
    if (!email.trim() || !password) return Alert.alert('Error', 'Email and password are required')
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoCircle}>
            <Ionicons name="school-outline" size={34} color="#ffffff" />
          </View>
          <Text style={s.appName}>EduCRM</Text>
          <Text style={s.appSub}>Education CRM Platform</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Sign in to your account</Text>

          <View style={s.field}>
            <Text style={s.label}>Email Address</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="admin@demo.com"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={s.passWrap}>
              <TextInput
                style={[s.input, { paddingRight: 48 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(v => !v)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="white" size="small" />
              : <Text style={s.btnText}>Sign In</Text>
            }
          </TouchableOpacity>

          <View style={s.demoBox}>
            <Text style={s.demoTitle}>Demo Credentials</Text>
            <Text style={s.demoText}>admin@demo.com / Demo@1234</Text>
            <Text style={s.demoText}>counsellor@demo.com / Demo@1234</Text>
          </View>
        </View>

        <Text style={s.footer}>EduCRM · Education CRM Platform</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: NAVY },
  scroll:     { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap:   { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 72, height: 72, borderRadius: 20, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName:    { fontSize: 28, fontWeight: '800', color: '#ffffff' },
  appSub:     { fontSize: 14, color: '#64748b', marginTop: 4 },
  card:       { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, elevation: 8 },
  cardTitle:  { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  field:      { marginBottom: 16 },
  label:      { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:      { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc' },
  passWrap:   { position: 'relative' },
  eyeBtn:     { position: 'absolute', right: 14, top: 13 },
  btn:        { backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  demoBox:    { marginTop: 20, backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  demoTitle:  { fontSize: 11, fontWeight: '700', color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  demoText:   { fontSize: 12, color: '#64748b', fontFamily: 'monospace', marginTop: 2 },
  footer:     { textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 24 },
})
