import React, { useEffect, useState } from 'react'
import {
  View, Text, Switch, TextInput, ScrollView,
  TouchableOpacity, StyleSheet, Alert, Linking, StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useCallStore } from '../store/callStore'

const BG      = '#0f172a'
const SURFACE = 'rgba(255,255,255,0.06)'
const BORDER  = 'rgba(255,255,255,0.1)'
const ACCENT  = '#6366f1'
const SUCCESS = '#10b981'
const GOLD    = '#f59e0b'
const WA_GREEN= '#25D366'
const TEXT    = '#f1f5f9'
const MUTED   = '#94a3b8'

const PRESET_VARIABLES = ['{name}', '{course}', '{phone}', '{institute}', '{date}']

const DEFAULT_TEMPLATE = `Hi {name},

Thank you for your enquiry about {course}.

We will connect with you shortly to help you with the admission process.

Regards,
Team`

let CallDetector = null
try { CallDetector = require('react-native-call-detection') } catch {}

export default function CallSettingsScreen({ navigation }) {
  const { autoWhatsApp, setAutoWhatsApp, template, setTemplate, cooldown, setCooldown } = useCallStore()
  const [localTemplate, setLocalTemplate] = useState(template || DEFAULT_TEMPLATE)
  const [localCooldown, setLocalCooldown] = useState(String(cooldown || 60))
  const [saved, setSaved] = useState(false)

  const callDetectionAvailable = !!CallDetector

  const save = () => {
    setTemplate(localTemplate)
    setCooldown(parseInt(localCooldown) || 60)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const insertVariable = (v) => {
    setLocalTemplate(t => t + v)
  }

  const testWhatsApp = () => {
    const msg = localTemplate.replace(/{name}/g, 'Test User').replace(/{course}/g, 'MBA').replace(/{phone}/g, '9999999999')
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`).catch(() => {
      Alert.alert('WhatsApp not installed', 'Please install WhatsApp to use this feature')
    })
  }

  const sectionTitle = (title, icon) => (
    <View style={sec.titleRow}>
      <Ionicons name={icon} size={16} color={ACCENT} />
      <Text style={sec.title}>{title}</Text>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={TEXT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Auto WhatsApp Settings</Text>
        <TouchableOpacity onPress={save} style={[s.saveBtn, saved && { backgroundColor: SUCCESS + '30' }]}>
          <Text style={[s.saveBtnText, { color: saved ? SUCCESS : ACCENT }]}>{saved ? 'Saved!' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.root} contentContainerStyle={s.content}>
        {/* Auto WhatsApp Toggle */}
        <View style={s.card}>
          {sectionTitle('Auto WhatsApp After Call', 'logo-whatsapp')}
          <Text style={s.desc}>
            After a call ends, automatically open WhatsApp with a pre-filled message template for the lead you just called.
          </Text>
          <View style={s.toggleRow}>
            <View>
              <Text style={s.toggleLabel}>Enable Auto WhatsApp</Text>
              <Text style={s.toggleSub}>{autoWhatsApp ? 'Active — opens after each call' : 'Disabled'}</Text>
            </View>
            <Switch
              value={autoWhatsApp}
              onValueChange={setAutoWhatsApp}
              trackColor={{ false: '#334155', true: WA_GREEN + '60' }}
              thumbColor={autoWhatsApp ? WA_GREEN : '#64748b'}
            />
          </View>

          {!callDetectionAvailable && (
            <View style={s.warningBox}>
              <Ionicons name="warning-outline" size={14} color={GOLD} />
              <Text style={[s.warningText, { color: GOLD }]}>
                Call detection requires a custom build. Currently using manual trigger mode.
              </Text>
            </View>
          )}
        </View>

        {/* Cooldown */}
        <View style={s.card}>
          {sectionTitle('Cooldown Period', 'timer-outline')}
          <Text style={s.desc}>Minimum seconds between auto-WhatsApp triggers to avoid duplicates.</Text>
          <View style={s.row}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={localCooldown}
              onChangeText={setLocalCooldown}
              keyboardType="numeric"
              placeholder="60"
              placeholderTextColor="#475569"
            />
            <Text style={{ color: MUTED, fontSize: 14 }}>seconds</Text>
          </View>
        </View>

        {/* Template Editor */}
        <View style={s.card}>
          {sectionTitle('Message Template', 'create-outline')}
          <Text style={s.desc}>Use variables to personalise each message automatically.</Text>

          <View style={s.variableRow}>
            {PRESET_VARIABLES.map(v => (
              <TouchableOpacity key={v} onPress={() => insertVariable(v)} style={s.variablePill}>
                <Text style={s.variablePillText}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={s.templateInput}
            value={localTemplate}
            onChangeText={setLocalTemplate}
            multiline
            textAlignVertical="top"
            placeholder="Write your WhatsApp template..."
            placeholderTextColor="#475569"
          />

          <TouchableOpacity style={s.testBtn} onPress={testWhatsApp}>
            <Ionicons name="send-outline" size={15} color={WA_GREEN} />
            <Text style={[s.testBtnText, { color: WA_GREEN }]}>Test Template in WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* How it works */}
        <View style={s.card}>
          {sectionTitle('How It Works', 'information-circle-outline')}
          <View style={{ gap: 10 }}>
            {[
              { icon: 'call-outline', text: 'You make or receive a call to/from a lead', color: ACCENT },
              { icon: 'close-circle-outline', text: 'Call ends', color: MUTED },
              { icon: 'search-outline', text: 'App detects the phone number and finds the lead', color: '#3b82f6' },
              { icon: 'logo-whatsapp', text: 'WhatsApp opens with the filled template', color: WA_GREEN },
              { icon: 'checkmark-circle-outline', text: 'Call is automatically logged to CRM', color: SUCCESS },
            ].map((step, i) => (
              <View key={i} style={s.stepRow}>
                <View style={[s.stepNum, { backgroundColor: step.color + '18' }]}>
                  <Ionicons name={step.icon} size={14} color={step.color} />
                </View>
                <Text style={s.stepText}>{step.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  content:      { padding: 16, paddingBottom: 32, gap: 12 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  headerTitle:  { flex: 1, fontSize: 16, fontWeight: '800', color: TEXT },
  saveBtn:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: ACCENT + '50' },
  saveBtnText:  { fontSize: 13, fontWeight: '700' },
  card:         { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, gap: 12 },
  desc:         { fontSize: 13, color: MUTED, lineHeight: 20 },
  toggleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel:  { fontSize: 15, fontWeight: '700', color: TEXT },
  toggleSub:    { fontSize: 12, color: MUTED, marginTop: 2 },
  warningBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, backgroundColor: GOLD + '15', borderWidth: 1, borderColor: GOLD + '30' },
  warningText:  { flex: 1, fontSize: 12, lineHeight: 18 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input:        { borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: TEXT, backgroundColor: 'rgba(255,255,255,0.04)' },
  variableRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variablePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: ACCENT + '20', borderWidth: 1, borderColor: ACCENT + '40' },
  variablePillText: { fontSize: 12, fontWeight: '700', color: '#a5b4fc' },
  templateInput:{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 14, fontSize: 14, color: TEXT, backgroundColor: 'rgba(255,255,255,0.04)', minHeight: 160 },
  testBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: WA_GREEN + '15', borderWidth: 1, borderColor: WA_GREEN + '30' },
  testBtnText:  { fontSize: 14, fontWeight: '700' },
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNum:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepText:     { flex: 1, fontSize: 13, color: TEXT },
})

const sec = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:    { fontSize: 14, fontWeight: '800', color: TEXT },
})
