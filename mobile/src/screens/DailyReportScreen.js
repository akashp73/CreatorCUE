import React, { useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Share, Linking, RefreshControl, ActivityIndicator,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { callsApi } from '../services/api'

const NAVY = '#0f172a', INDIGO = '#4f46e5'

const STAT_CARDS = [
  { key: 'total_calls',       label: 'Total Calls',     icon: 'phone',               color: INDIGO },
  { key: 'connected_calls',   label: 'Connected',       icon: 'phone-check',         color: '#10B981' },
  { key: 'missed_calls',      label: 'Missed / No Ans', icon: 'phone-missed',        color: '#E53E3E' },
  { key: 'total_duration',    label: 'Duration (min)',  icon: 'timer-outline',       color: '#F59E0B', suffix: ' min' },
  { key: 'leads_converted',   label: 'Converted',       icon: 'trending-up',         color: '#10B981' },
  { key: 'new_leads',         label: 'New Leads',       icon: 'account-plus',        color: INDIGO },
  { key: 'whatsapp_sent',     label: 'WhatsApp Sent',   icon: 'whatsapp',            color: '#25D366' },
]

function buildReportText(data) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  return [
    `📊 My Daily Report — ${today}`,
    '',
    '📞 Calls',
    `• Total Logged: ${data.total_calls}`,
    `• Connected: ${data.connected_calls}`,
    `• Missed: ${data.missed_calls}`,
    `• Duration: ${data.total_duration} min`,
    '',
    '💼 Leads',
    `• Converted: ${data.leads_converted}`,
    `• New Leads: ${data.new_leads}`,
    '',
    `💬 WhatsApp Sent: ${data.whatsapp_sent}`,
    '',
    '— via EduCRM',
  ].join('\n')
}

export default function DailyReportScreen({ navigation }) {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['mob-daily-report'],
    queryFn: () => callsApi.today().then(r => r.data),
    refetchInterval: 60000,
  })

  const handleShare = useCallback(async () => {
    if (!data) return
    try { await Share.share({ message: buildReportText(data) }) } catch {}
  }, [data])

  const handleWhatsApp = useCallback(() => {
    if (!data) return
    const text = encodeURIComponent(buildReportText(data))
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() =>
      Linking.openURL(`https://wa.me/?text=${text}`)
    )
  }, [data])

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.container}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={INDIGO} />}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.heading}>My Daily Report</Text>
          <Text style={s.subheading}>{today}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('CallSettings')} style={s.settingsBtn}>
          <MaterialCommunityIcons name="cog-outline" size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.loading}><ActivityIndicator size="large" color={INDIGO} /></View>
      ) : data ? (
        <>
          {/* Stat grid */}
          <View style={s.grid}>
            {STAT_CARDS.map(({ key, label, icon, color, suffix = '' }) => (
              <View key={key} style={s.statCard}>
                <View style={[s.statIcon, { backgroundColor: color + '20' }]}>
                  <MaterialCommunityIcons name={icon} size={20} color={color} />
                </View>
                <Text style={s.statValue}>{data[key] ?? 0}{suffix}</Text>
                <Text style={s.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={s.actions}>
            <TouchableOpacity style={[s.btn, s.btnShare]} onPress={handleShare}>
              <MaterialCommunityIcons name="share-variant" size={18} color="white" />
              <Text style={s.btnText}>Share Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, s.btnWA]} onPress={handleWhatsApp}>
              <MaterialCommunityIcons name="whatsapp" size={18} color="white" />
              <Text style={s.btnText}>Send via WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {/* Report preview */}
          <View style={s.preview}>
            <Text style={s.previewLabel}>REPORT PREVIEW</Text>
            <Text style={s.previewText}>{buildReportText(data)}</Text>
          </View>
        </>
      ) : (
        <Text style={s.empty}>No data yet. Log some calls first!</Text>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: '800', color: NAVY },
  subheading: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  settingsBtn: { padding: 8 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '47%', backgroundColor: 'white', borderRadius: 16, padding: 14, alignItems: 'flex-start', elevation: 2 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 26, fontWeight: '800', color: NAVY, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  btnShare: { backgroundColor: INDIGO },
  btnWA: { backgroundColor: '#25D366' },
  btnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  preview: { backgroundColor: NAVY, borderRadius: 16, padding: 16 },
  previewLabel: { fontSize: 10, color: '#64748B', fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  previewText: { fontSize: 13, color: '#94A3B8', lineHeight: 22, fontFamily: 'monospace' },
  empty: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 40, fontSize: 14 },
})
