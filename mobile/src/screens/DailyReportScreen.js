import React, { useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { callsApi } from '../services/api'

const BG      = '#0f172a'
const SURFACE = 'rgba(255,255,255,0.06)'
const BORDER  = 'rgba(255,255,255,0.1)'
const ACCENT  = '#6366f1'
const SUCCESS = '#10b981'
const DANGER  = '#ef4444'
const GOLD    = '#f59e0b'
const WA_GREEN= '#25D366'
const TEXT    = '#f1f5f9'
const MUTED   = '#94a3b8'

const STAT_CONFIG = [
  { key: 'total_calls',     label: 'Calls Made',   icon: 'call-outline',             color: ACCENT },
  { key: 'connected_calls', label: 'Connected',    icon: 'checkmark-circle-outline', color: SUCCESS },
  { key: 'missed_calls',    label: 'Missed',       icon: 'close-circle-outline',     color: DANGER },
  { key: 'total_duration',  label: 'Talk Time',    icon: 'timer-outline',            color: GOLD, suffix: 'min' },
  { key: 'leads_converted', label: 'Converted',    icon: 'trophy-outline',           color: SUCCESS },
  { key: 'new_leads',       label: 'New Leads',    icon: 'person-add-outline',       color: '#3b82f6' },
]

function StatTile({ iconName, label, value, color, suffix }) {
  return (
    <View style={[st.tile, { borderColor: color + '30' }]}>
      <View style={[st.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={iconName} size={22} color={color} />
      </View>
      <Text style={[st.value, { color }]}>{value ?? '—'}{suffix || ''}</Text>
      <Text style={st.label}>{label}</Text>
    </View>
  )
}

export default function DailyReportScreen({ navigation }) {
  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['mob-daily-report'],
    queryFn: () => callsApi.today().then(r => r.data),
  })

  const buildReportText = useCallback(() => {
    if (!report) return ''
    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    return `*My CRM Report — ${today}*\n\n` +
      `Calls Made: ${report.total_calls || 0}\n` +
      `Connected: ${report.connected_calls || 0}\n` +
      `Missed: ${report.missed_calls || 0}\n` +
      `Talk Time: ${report.total_duration || 0} min\n` +
      `Leads Converted: ${report.leads_converted || 0}\n` +
      `New Leads: ${report.new_leads || 0}\n\n` +
      `Sent via EduCRM`
  }, [report])

  const shareViaWhatsApp = () => {
    const msg = buildReportText()
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`).catch(() => {
      alert('WhatsApp not installed. Share manually.')
    })
  }

  const [refreshing, setRefreshing] = React.useState(false)
  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false) }

  const conversionRate = report?.total_calls > 0
    ? Math.round((report.leads_converted / report.total_calls) * 100)
    : 0

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>My Daily Report</Text>
          <Text style={s.headerSub}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={s.backBtn}>
          <Ionicons name="refresh-outline" size={20} color={MUTED} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.root}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {isLoading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : (
          <>
            {/* Conversion Rate Hero */}
            <View style={s.heroCard}>
              <Text style={s.heroLabel}>Conversion Rate</Text>
              <Text style={[s.heroValue, { color: conversionRate > 20 ? SUCCESS : conversionRate > 10 ? GOLD : DANGER }]}>
                {conversionRate}%
              </Text>
              <Text style={s.heroSub}>
                {report?.leads_converted || 0} converted from {report?.total_calls || 0} calls
              </Text>
              <View style={s.rateBar}>
                <View style={[s.rateBarFill, {
                  width: `${Math.min(conversionRate, 100)}%`,
                  backgroundColor: conversionRate > 20 ? SUCCESS : conversionRate > 10 ? GOLD : DANGER,
                }]} />
              </View>
            </View>

            {/* Stats Grid */}
            <View style={s.statsGrid}>
              {STAT_CONFIG.map(cfg => (
                <StatTile
                  key={cfg.key}
                  iconName={cfg.icon}
                  label={cfg.label}
                  value={report?.[cfg.key] ?? 0}
                  color={cfg.color}
                  suffix={cfg.suffix}
                />
              ))}
            </View>

            {/* Call Breakdown */}
            {report?.total_calls > 0 && (
              <View style={s.card}>
                <Text style={s.cardTitle}>Call Breakdown</Text>
                {[
                  { label: 'Connected', value: report?.connected_calls || 0, color: SUCCESS, key: 'connected' },
                  { label: 'Missed', value: report?.missed_calls || 0, color: DANGER, key: 'missed' },
                  { label: 'Callback', value: report?.callback_calls || 0, color: ACCENT, key: 'callback' },
                  { label: 'Not Interested', value: report?.not_interested || 0, color: '#475569', key: 'not' },
                ].map(row => {
                  const pct = report?.total_calls > 0 ? Math.round((row.value / report.total_calls) * 100) : 0
                  return (
                    <View key={row.key} style={s.breakdownRow}>
                      <Text style={[s.breakdownLabel, { color: row.color }]}>{row.label}</Text>
                      <View style={s.breakdownBar}>
                        <View style={[s.breakdownBarFill, { width: `${pct}%`, backgroundColor: row.color }]} />
                      </View>
                      <Text style={[s.breakdownVal, { color: row.color }]}>{row.value}</Text>
                    </View>
                  )
                })}
              </View>
            )}

            {/* Generate + Share */}
            <View style={s.shareSection}>
              <Text style={s.shareTitle}>Generate Report</Text>

              <View style={s.reportPreview}>
                <Text style={s.reportText}>{buildReportText()}</Text>
              </View>

              <TouchableOpacity style={s.whatsappBtn} onPress={shareViaWhatsApp}>
                <Ionicons name="logo-whatsapp" size={20} color="white" />
                <Text style={s.whatsappBtnText}>Share via WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root:            { flex: 1 },
  content:         { padding: 16, paddingBottom: 32, gap: 14 },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn:         { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  headerTitle:     { fontSize: 17, fontWeight: '800', color: TEXT },
  headerSub:       { fontSize: 12, color: MUTED },
  heroCard:        { backgroundColor: SURFACE, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  heroLabel:       { fontSize: 12, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroValue:       { fontSize: 56, fontWeight: '900', marginTop: 4 },
  heroSub:         { fontSize: 13, color: MUTED, marginTop: 4 },
  rateBar:         { width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 14, overflow: 'hidden' },
  rateBarFill:     { height: '100%', borderRadius: 3 },
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card:            { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, gap: 12 },
  cardTitle:       { fontSize: 12, fontWeight: '800', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  breakdownRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakdownLabel:  { width: 100, fontSize: 12, fontWeight: '600' },
  breakdownBar:    { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  breakdownBarFill:{ height: '100%', borderRadius: 3 },
  breakdownVal:    { width: 30, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  shareSection:    { gap: 12 },
  shareTitle:      { fontSize: 14, fontWeight: '800', color: TEXT },
  reportPreview:   { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  reportText:      { fontSize: 12, color: MUTED, lineHeight: 20, fontFamily: 'monospace' },
  whatsappBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, backgroundColor: WA_GREEN },
  whatsappBtnText: { fontSize: 15, fontWeight: '800', color: 'white' },
})

const st = StyleSheet.create({
  tile:     { width: '47%', backgroundColor: SURFACE, borderRadius: 16, padding: 14, borderWidth: 1, alignItems: 'center', gap: 6 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  value:    { fontSize: 28, fontWeight: '900' },
  label:    { fontSize: 11, color: MUTED, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
})
