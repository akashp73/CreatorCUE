import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import useAuthStore from '../store/authStore'

const BG    = '#000000'
const WHITE = '#ffffff'
const TEXT  = '#111827'
const MUTED = '#9ca3af'

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

        {/* Dark header with logo */}
        <View style={s.header}>
          <View style={s.logoWrap}>
            <View style={s.logoBox}>
              <Ionicons name="school-outline" size={28} color={WHITE} />
            </View>
            <Text style={s.appName}>EduCRM</Text>
          </View>
          <Text style={s.tagline}>Enroll more. Follow up faster.</Text>
          <Text style={s.taglineSub}>The next-gen Education CRM.</Text>
        </View>

        {/* White form card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Welcome!</Text>
          <Text style={s.cardSub}>Sign in to your account</Text>

          <View style={s.field}>
            <Text style={s.label}>Email Address</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="admin@demo.com"
              placeholderTextColor={MUTED}
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
                placeholderTextColor={MUTED}
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(v => !v)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={MUTED} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={WHITE} size="small" /> : <Text style={s.btnText}>Sign In →</Text>}
          </TouchableOpacity>

          <View style={s.demoBox}>
            <Text style={s.demoTitle}>Demo Credentials</Text>
            {[
              { role: 'Admin', email: 'admin@demo.com' },
              { role: 'Counsellor', email: 'counsellor@demo.com' },
            ].map(c => (
              <TouchableOpacity key={c.role} onPress={() => setEmail(c.email)} style={s.demoRow}>
                <Text style={s.demoRole}>{c.role}</Text>
                <Text style={s.demoEmail}>{c.email}</Text>
              </TouchableOpacity>
            ))}
            <Text style={s.demoPass}>Password: Demo@1234</Text>
          </View>
        </View>

        <Text style={s.footer}>© EduCRM 2026 · An initiative by Creator CUE</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: BG },
  scroll:     { flexGrow: 1, paddingBottom: 32 },
  header:     { backgroundColor: BG, paddingHorizontal: 28, paddingTop: 64, paddingBottom: 36 },
  logoWrap:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  logoBox:    { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  appName:    { fontSize: 22, fontWeight: '800', color: WHITE, letterSpacing: -0.5 },
  tagline:    { fontSize: 28, fontWeight: '200', color: WHITE, letterSpacing: -1, lineHeight: 34 },
  taglineSub: { fontSize: 14, color: '#4b5563', marginTop: 8 },
  card:       { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingTop: 32, flex: 1, minHeight: 400 },
  cardTitle:  { fontSize: 24, fontWeight: '700', color: TEXT, letterSpacing: -0.5, marginBottom: 4 },
  cardSub:    { fontSize: 14, color: MUTED, marginBottom: 24 },
  field:      { marginBottom: 16 },
  label:      { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:      { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: TEXT, backgroundColor: WHITE },
  passWrap:   { position: 'relative' },
  eyeBtn:     { position: 'absolute', right: 14, top: 13 },
  btn:        { backgroundColor: TEXT, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 6, elevation: 2 },
  btnDisabled:{ opacity: 0.5 },
  btnText:    { color: WHITE, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  demoBox:    { marginTop: 20, backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#f3f4f6' },
  demoTitle:  { fontSize: 11, fontWeight: '700', color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  demoRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  demoRole:   { fontSize: 12, color: MUTED },
  demoEmail:  { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: TEXT, backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  demoPass:   { fontSize: 12, color: MUTED, marginTop: 6 },
  footer:     { textAlign: 'center', color: '#374151', fontSize: 12, marginTop: 24, paddingHorizontal: 24 },
})
