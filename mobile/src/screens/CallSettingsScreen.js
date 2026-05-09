import React, { useEffect, useState } from 'react'
import {
  View, Text, Switch, TextInput, ScrollView,
  TouchableOpacity, StyleSheet, Alert, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useCallStore } from '../store/callStore'

const NAVY   = '#0f172a'
const ACCENT = '#4f46e5'
const BG     = '#f8fafc'

// Attempt to load react-native-call-detection (requires custom EAS build)
// Install: npx expo install react-native-call-detection
// Then rebuild with: eas build --platform android --profile preview
let CallDetector = null
try {
  CallDetector = require('react-native-call-detection')
} catch {
  // Module not available in current build — using AppState fallback
}

const COOLDOWN_OPTIONS = [1, 3, 7, 14, 30]
const TEMPLATE_VARS    = ['{name}', '{course}', '{phone}']

export default function CallSettingsScreen() {
  const {
    autoWhatsApp, cooldownDays, whatsappTemplate,
    setAutoWhatsApp, setCooldownDays, setTemplate, load,
  } = useCallStore()

  const [localTemplate, setLocalTemplate] = useState(whatsappTemplate)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])
  useEffect(() => { setLocalTemplate(whatsappTemplate) }, [whatsappTemplate])

  const saveTemplate = () => {
    setTemplate(localTemplate.trim() || whatsappTemplate)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const insertVar = (v) => setLocalTemplate(t => t + v)

  return (
    <ScrollView style={cs.root} contentContainerStyle={cs.container}>

      {/* Auto WhatsApp toggle */}
      <Text style={cs.sectionLabel}>Auto WhatsApp After Call</Text>
      <View style={cs.card}>
        <View style={cs.row}>
          <View style={{ flex: 1 }}>
            <Text style={cs.rowTitle}>Enable Auto WhatsApp</Text>
            <Text style={cs.rowSub}>
              After a call ends, prompt to send a WhatsApp follow-up message
            </Text>
          </View>
          <Switch
            value={autoWhatsApp}
            onValueChange={setAutoWhatsApp}
            trackColor={{ false: '#e2e8f0', true: ACCENT + '60' }}
            thumbColor={autoWhatsApp ? ACCENT : '#94a3b8'}
          />
        </View>

        {CallDetector ? (
          <View style={cs.infoRow}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={cs.infoText}>Call detection active (native module loaded)</Text>
          </View>
        ) : (
          <View style={[cs.infoRow, { backgroundColor: '#fef9c3', borderColor: '#fde68a' }]}>
            <Ionicons name="information-circle-outline" size={14} color="#d97706" />
            <Text style={[cs.infoText, { color: '#92400e' }]}>
              Using AppState detection. For enhanced background detection, run:{'\n'}
              <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>npx expo install react-native-call-detection</Text>
              {'\n'}then rebuild with EAS.
            </Text>
          </View>
        )}
      </View>

      {autoWhatsApp && (
        <>
          {/* Cooldown period */}
          <Text style={cs.sectionLabel}>Cooldown Period</Text>
          <View style={cs.card}>
            <Text style={cs.rowSub}>Minimum days between prompts for the same number:</Text>
            <View style={cs.chipRow}>
              {COOLDOWN_OPTIONS.map(d => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setCooldownDays(d)}
                  style={[cs.chip, cooldownDays === d && cs.chipActive]}
                >
                  <Text style={[cs.chipText, cooldownDays === d && cs.chipTextActive]}>
                    {d} {d === 1 ? 'day' : 'days'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Template editor */}
          <Text style={cs.sectionLabel}>Message Template</Text>
          <View style={cs.card}>
            <Text style={cs.rowSub}>
              Variables: {TEMPLATE_VARS.join(', ')}
            </Text>
            <TextInput
              style={cs.templateInput}
              value={localTemplate}
              onChangeText={setLocalTemplate}
              multiline
              numberOfLines={5}
              placeholder="Type your follow-up message..."
              placeholderTextColor="#94a3b8"
              textAlignVertical="top"
            />
            <View style={cs.varRow}>
              {TEMPLATE_VARS.map(v => (
                <TouchableOpacity key={v} onPress={() => insertVar(v)} style={cs.varChip}>
                  <Text style={cs.varChipText}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[cs.saveBtn, saved && cs.saveBtnDone]}
              onPress={saveTemplate}
            >
              <Ionicons name={saved ? 'checkmark' : 'save-outline'} size={16} color="white" />
              <Text style={cs.saveBtnText}>{saved ? 'Saved!' : 'Save Template'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Info footer */}
      <View style={cs.footerInfo}>
        <Ionicons name="information-circle-outline" size={16} color="#64748b" />
        <Text style={cs.footerText}>
          When you tap the Call button on a lead profile, the app tracks the call. When you return to the app, you'll be prompted to log the call and optionally send your WhatsApp template.
        </Text>
      </View>
    </ScrollView>
  )
}

const cs = StyleSheet.create({
  root:           { flex: 1, backgroundColor: BG },
  container:      { padding: 16, paddingBottom: 40 },
  sectionLabel:   { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  card:           { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, elevation: 2, marginBottom: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  row:            { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle:       { fontSize: 15, fontWeight: '600', color: NAVY, marginBottom: 3 },
  rowSub:         { fontSize: 12, color: '#64748b', lineHeight: 18, marginBottom: 10 },
  infoRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, padding: 10 },
  infoText:       { flex: 1, fontSize: 12, color: '#166534', lineHeight: 18 },
  chipRow:        { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  chipActive:     { borderColor: ACCENT, backgroundColor: '#eef2ff' },
  chipText:       { fontSize: 13, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: ACCENT },
  templateInput:  { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 13, color: NAVY, minHeight: 110, marginBottom: 10, backgroundColor: '#f8fafc' },
  varRow:         { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  varChip:        { backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  varChipText:    { fontSize: 12, color: ACCENT, fontWeight: '600', fontFamily: 'monospace' },
  saveBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 13 },
  saveBtnDone:    { backgroundColor: '#10b981' },
  saveBtnText:    { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  footerInfo:     { flexDirection: 'row', gap: 10, backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginTop: 16, elevation: 1 },
  footerText:     { flex: 1, fontSize: 12, color: '#64748b', lineHeight: 18 },
})
