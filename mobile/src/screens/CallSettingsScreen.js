import React, { useEffect, useState } from 'react'
import {
  View, Text, Switch, TextInput, ScrollView,
  TouchableOpacity, StyleSheet, Alert,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useCallStore } from '../store/callStore'

const NAVY = '#0f172a', INDIGO = '#4f46e5'

const TEMPLATE_VARS = ['{name}', '{course}', '{phone}']
const COOLDOWN_OPTIONS = [1, 3, 7, 14, 30]

export default function CallSettingsScreen() {
  const {
    autoWhatsApp, cooldownDays, whatsappTemplate,
    setAutoWhatsApp, setCooldownDays, setTemplate, load,
  } = useCallStore()
  const [localTemplate, setLocalTemplate] = useState(whatsappTemplate)

  useEffect(() => { load() }, [])
  useEffect(() => { setLocalTemplate(whatsappTemplate) }, [whatsappTemplate])

  const saveTemplate = () => {
    setTemplate(localTemplate)
    Alert.alert('Saved', 'Template updated!')
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.container}>
      <Text style={s.sectionTitle}>Auto WhatsApp After Call</Text>
      <View style={s.card}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowLabel}>Enable Auto WhatsApp</Text>
            <Text style={s.rowSub}>Prompts you to send WhatsApp after a call ends</Text>
          </View>
          <Switch
            value={autoWhatsApp}
            onValueChange={setAutoWhatsApp}
            trackColor={{ false: '#D1D5DB', true: INDIGO + '60' }}
            thumbColor={autoWhatsApp ? INDIGO : '#9CA3AF'}
          />
        </View>
      </View>

      {autoWhatsApp && (
        <>
          <Text style={s.sectionTitle}>Cooldown Period</Text>
          <View style={s.card}>
            <Text style={s.rowSub}>Don't prompt for the same number within:</Text>
            <View style={s.cooldownRow}>
              {COOLDOWN_OPTIONS.map(d => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setCooldownDays(d)}
                  style={[s.cooldownChip, cooldownDays === d && s.cooldownChipActive]}
                >
                  <Text style={[s.cooldownText, cooldownDays === d && s.cooldownTextActive]}>
                    {d}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={s.sectionTitle}>Message Template</Text>
          <View style={s.card}>
            <Text style={s.rowSub}>Available variables: {TEMPLATE_VARS.join(', ')}</Text>
            <TextInput
              style={s.templateInput}
              value={localTemplate}
              onChangeText={setLocalTemplate}
              multiline
              numberOfLines={5}
              placeholder="Your WhatsApp message template…"
              placeholderTextColor="#9CA3AF"
              textAlignVertical="top"
            />
            <View style={s.varRow}>
              {TEMPLATE_VARS.map(v => (
                <TouchableOpacity key={v} onPress={() => setLocalTemplate(t => t + v)} style={s.varChip}>
                  <Text style={s.varText}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={saveTemplate}>
              <MaterialCommunityIcons name="content-save" size={16} color="white" />
              <Text style={s.saveBtnText}>Save Template</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={s.info}>
        <MaterialCommunityIcons name="information-outline" size={16} color="#6B7280" />
        <Text style={s.infoText}>
          When you tap CALL on a lead, the app tracks the call. When you return to the app, you'll be prompted to log the call and optionally send a WhatsApp follow-up.
        </Text>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, elevation: 2, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: NAVY },
  rowSub: { fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 18, marginBottom: 8 },
  cooldownRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  cooldownChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 2, borderColor: '#E5E7EB' },
  cooldownChipActive: { borderColor: INDIGO, backgroundColor: '#EEF2FF' },
  cooldownText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  cooldownTextActive: { color: INDIGO },
  templateInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 13, color: NAVY, minHeight: 100, marginBottom: 10 },
  varRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  varChip: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  varText: { fontSize: 12, color: INDIGO, fontWeight: '600', fontFamily: 'monospace' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: INDIGO, borderRadius: 12, paddingVertical: 12 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  info: { flexDirection: 'row', gap: 10, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, marginTop: 16 },
  infoText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 18 },
})
