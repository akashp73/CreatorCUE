import React, { useEffect, useState } from 'react'
import {
  View, Text, Switch, TextInput, ScrollView,
  TouchableOpacity, StyleSheet, Alert, Linking, StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useCallStore } from '../store/callStore'

const PURPLE = '#4a1a8a'
const BG     = '#f0f0f6'
const WHITE  = '#ffffff'
const TEXT   = '#1a1a2e'
const MUTED  = '#6b7280'
const WA     = '#25D366'
const GOLD   = '#f59e0b'

const PRESET_VARS = ['{name}', '{course}', '{phone}', '{institute}', '{date}']

const DEFAULT_TEMPLATE = `Hi {name},

Thank you for your enquiry about {course}.

We will connect with you shortly to help you with the admission process.

Regards,
EduCRM Team`

let CallDetector = null
try { CallDetector = require('react-native-call-detection') } catch {}

export default function CallSettingsScreen({ navigation }) {
  const { autoWhatsApp, setAutoWhatsApp, template, setTemplate, cooldown, setCooldown } = useCallStore()
  const [localTemplate, setLocalTemplate] = useState(template || DEFAULT_TEMPLATE)
  const [localCooldown, setLocalCooldown] = useState(String(cooldown || 60))
  const [saved, setSaved] = useState(false)
  const [incomingEnabled, setIncomingEnabled] = useState(true)
  const [outgoingEnabled, setOutgoingEnabled] = useState(true)
  const [missedEnabled, setMissedEnabled] = useState(false)

  const save = () => {
    setTemplate(localTemplate)
    setCooldown(parseInt(localCooldown) || 60)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const testWA = () => {
    const msg = localTemplate.replace(/{name}/g, 'Test User').replace(/{course}/g, 'MBA')
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`).catch(() => Alert.alert('WhatsApp not installed'))
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>
        <Text style={s.title}>Auto WhatsApp Settings</Text>
        <TouchableOpacity onPress={save} style={[s.saveBtn, saved && { backgroundColor: '#10b981' + '20' }]}>
          <Text style={[s.saveBtnText, { color: saved ? '#10b981' : PURPLE }]}>{saved ? 'Saved!' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        {/* Main toggle */}
        <View style={card.c}>
          <View style={card.row}>
            <View>
              <Text style={card.title}>Auto WhatsApp After Call</Text>
              <Text style={card.sub}>{autoWhatsApp ? 'Active' : 'Disabled'}</Text>
            </View>
            <Switch value={autoWhatsApp} onValueChange={setAutoWhatsApp} trackColor={{ false: '#e5e7eb', true: WA + '80' }} thumbColor={autoWhatsApp ? WA : '#9ca3af'} />
          </View>
          {!CallDetector && (
            <View style={card.warning}>
              <Ionicons name="warning-outline" size={14} color={GOLD} />
              <Text style={card.warningText}>Call detection requires a custom build. Using manual mode.</Text>
            </View>
          )}
        </View>

        {/* Call type toggles */}
        <View style={card.c}>
          <Text style={card.sectionTitle}>Trigger on call type</Text>
          {[
            { label: 'Outgoing Calls', value: outgoingEnabled, onChange: setOutgoingEnabled },
            { label: 'Incoming Calls', value: incomingEnabled, onChange: setIncomingEnabled },
            { label: 'Missed Calls', value: missedEnabled, onChange: setMissedEnabled },
          ].map((opt, i) => (
            <View key={i} style={[card.row, i > 0 && { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12, marginTop: 12 }]}>
              <Text style={card.optLabel}>{opt.label}</Text>
              <Switch value={opt.value} onValueChange={opt.onChange} trackColor={{ false: '#e5e7eb', true: PURPLE + '60' }} thumbColor={opt.value ? PURPLE : '#9ca3af'} />
            </View>
          ))}
        </View>

        {/* Cooldown */}
        <View style={card.c}>
          <Text style={card.sectionTitle}>Cooldown (seconds)</Text>
          <TextInput style={card.input} value={localCooldown} onChangeText={setLocalCooldown} keyboardType="numeric" placeholderTextColor={MUTED} />
        </View>

        {/* Template editor */}
        <View style={card.c}>
          <Text style={card.sectionTitle}>Message Template</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {PRESET_VARS.map(v => (
              <TouchableOpacity key={v} onPress={() => setLocalTemplate(t => t + v)} style={card.varPill}>
                <Text style={card.varText}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={card.templateInput}
            value={localTemplate}
            onChangeText={setLocalTemplate}
            multiline
            textAlignVertical="top"
            placeholder="Write your WhatsApp template..."
            placeholderTextColor={MUTED}
          />
          <TouchableOpacity style={card.testBtn} onPress={testWA}>
            <Ionicons name="logo-whatsapp" size={16} color={WA} />
            <Text style={[card.testBtnText, { color: WA }]}>Test in WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* How it works */}
        <View style={card.c}>
          <Text style={card.sectionTitle}>How It Works</Text>
          {[
            { icon: 'call-outline', text: 'You call a lead', color: PURPLE },
            { icon: 'close-outline', text: 'Call ends', color: MUTED },
            { icon: 'search-outline', text: 'App detects the number', color: '#3b82f6' },
            { icon: 'logo-whatsapp', text: 'WhatsApp opens with filled template', color: WA },
            { icon: 'checkmark-circle-outline', text: 'Call logged automatically to CRM', color: '#10b981' },
          ].map((step, i) => (
            <View key={i} style={card.stepRow}>
              <View style={[card.stepIcon, { backgroundColor: step.color + '15' }]}>
                <Ionicons name={step.icon} size={14} color={step.color} />
              </View>
              <Text style={card.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  header:     { backgroundColor: PURPLE, paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  title:      { flex: 1, fontSize: 17, fontWeight: '800', color: 'white' },
  saveBtn:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  saveBtnText:{ fontSize: 13, fontWeight: '700', color: 'white' },
})

const card = StyleSheet.create({
  c:           { backgroundColor: WHITE, borderRadius: 16, padding: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, gap: 8 },
  row:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:       { fontSize: 15, fontWeight: '700', color: TEXT },
  sub:         { fontSize: 12, color: MUTED, marginTop: 2 },
  sectionTitle:{ fontSize: 13, fontWeight: '800', color: TEXT, marginBottom: 4 },
  optLabel:    { fontSize: 14, fontWeight: '600', color: TEXT },
  input:       { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: TEXT, backgroundColor: '#f9fafb' },
  varPill:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: PURPLE + '15', borderWidth: 1, borderColor: PURPLE + '30' },
  varText:     { fontSize: 12, fontWeight: '700', color: PURPLE },
  templateInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 14, color: TEXT, minHeight: 140, backgroundColor: '#f9fafb' },
  testBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: WA + '15', borderWidth: 1, borderColor: WA + '30', marginTop: 4 },
  testBtnText: { fontSize: 13, fontWeight: '700' },
  warning:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, backgroundColor: GOLD + '10', borderWidth: 1, borderColor: GOLD + '25', marginTop: 4 },
  warningText: { flex: 1, fontSize: 12, color: GOLD, lineHeight: 18 },
  stepRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepIcon:    { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepText:    { flex: 1, fontSize: 13, color: TEXT },
})
