import React from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, RefreshControl, ActivityIndicator, StatusBar, Share,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { callsApi } from '../services/api'

const PURPLE = '#4a1a8a'
const BG     = '#f0f0f6'
const WHITE  = '#ffffff'
const TEXT   = '#1a1a2e'
const MUTED  = '#6b7280'
const SUCCESS= '#10b981'
const DANGER = '#ef4444'
const GOLD   = '#f59e0b'
const WA     = '#25D366'

const STATS = [
  { key: 'total_calls',     label: 'Calls Made',    icon: 'call-outline',             color: PURPLE },
  { key: 'connected_calls', label: 'Connected',     icon: 'checkmark-circle-outline', color: SUCCESS },
  { key: 'missed_calls',    label: 'Not Connected', icon: 'close-circle-outline',     color: DANGER },
  { key: 'total_duration',  label: 'Talk Time(min)',icon: 'timer-outline',            color: GOLD },
  { key: 'leads_converted', label: 'Converted',     icon: 'trophy-outline',           color: SUCCESS },
  { key: 'new_leads',       label: 'New Leads',     icon: 'person-add-outline',       color: '#3b82f6' },
]

function StatTile({ icon, label, value, color }) {
  return (
    <View style={[st.tile, { borderTopWidth: 3, borderTopColor: color }]}>
      <View style={[st.iconWrap, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[st.value, { color }]}>{value ?? 0}</Text>
      <Text style={st.label}>{label}</Text>
    </View>
  )
}

export default function DailyReportScreen({ navigation }) {
  const { data: report, isLoading, refetch } = useQuery({ queryKey: ['mob-daily-report'], queryFn: () => callsApi.today().then(r => r.data) })
  const [refreshing, setRefreshing] = React.useState(false)
  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false) }

  const convRate = report?.total_calls > 0 ? Math.round((report.leads_converted / report.total_calls) * 100) : 0
  const rateColor = convRate > 20 ? SUCCESS : convRate > 10 ? GOLD : DANGER

  const reportText = () => {
    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    return `My CRM Report - ${today}\n\n` +
      `Calls Made: ${report?.total_calls || 0}\n` +
      `Connected: ${report?.connected_calls || 0}\n` +
      `Not Connected: ${report?.missed_calls || 0}\n` +
      `Talk Time: ${report?.total_duration || 0} min\n` +
      `Leads Converted: ${report?.leads_converted || 0}\n` +
      `New Leads: ${report?.new_leads || 0}\n\n` +
      `Sent via EduCRM`
  }

  const shareWA = () => Linking.openURL(`whatsapp://send?text=${encodeURIComponent(reportText())}`).catch(() => alert('WhatsApp not installed'))
  const copyReport = () => Share.share({ message: reportText() })

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>My Daily Report</Text>
          <Text style={s.sub}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={s.backBtn}>
          <Ionicons name="refresh-outline" size={18} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}>
        {isLoading ? <ActivityIndicator size="large" color={PURPLE} style={{ marginTop: 40 }} /> : (
          <>
            {/* Conversion Rate hero */}
            <View style={s.heroCard}>
              <Text style={s.heroLabel}>Conversion Rate</Text>
              <Text style={[s.heroValue, { color: rateColor }]}>{convRate}%</Text>
              <Text style={s.heroSub}>{report?.leads_converted || 0} converted from {report?.total_calls || 0} calls</Text>
              <View style={s.rateBar}>
                <View style={[s.rateBarFill, { width: `${Math.min(convRate, 100)}%`, backgroundColor: rateColor }]} />
              </View>
            </View>

            {/* Stats grid */}
            <View style={s.grid}>
              {STATS.map(stat => (
                <StatTile key={stat.key} icon={stat.icon} label={stat.label} value={report?.[stat.key]} color={stat.color} />
              ))}
            </View>

            {/* Report preview + share */}
            <View style={s.previewCard}>
              <Text style={s.previewTitle}>Generated Report</Text>
              <Text style={s.previewText}>{reportText()}</Text>
            </View>

            <TouchableOpacity style={s.waBtn} onPress={shareWA}>
              <Ionicons name="logo-whatsapp" size={20} color="white" />
              <Text style={s.waBtnText}>Share via WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.copyBtn} onPress={copyReport}>
              <Ionicons name="copy-outline" size={16} color={PURPLE} />
              <Text style={s.copyBtnText}>Copy / Share via other app</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  header:      { backgroundColor: PURPLE, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 18, fontWeight: '800', color: 'white' },
  sub:         { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  heroCard:    { backgroundColor: WHITE, borderRadius: 20, padding: 20, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  heroLabel:   { fontSize: 12, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroValue:   { fontSize: 56, fontWeight: '900', marginTop: 4 },
  heroSub:     { fontSize: 13, color: MUTED, marginTop: 4 },
  rateBar:     { width: '100%', height: 8, borderRadius: 4, backgroundColor: '#f3f4f6', marginTop: 16, overflow: 'hidden' },
  rateBarFill: { height: '100%', borderRadius: 4 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  previewCard: { backgroundColor: WHITE, borderRadius: 16, padding: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  previewTitle:{ fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 10 },
  previewText: { fontSize: 12, color: MUTED, lineHeight: 22, fontFamily: 'monospace' },
  waBtn:       { backgroundColor: WA, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, elevation: 4, shadowColor: WA, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
  waBtnText:   { fontSize: 15, fontWeight: '800', color: 'white' },
  copyBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: PURPLE + '10', borderWidth: 1, borderColor: PURPLE + '30' },
  copyBtnText: { fontSize: 14, fontWeight: '700', color: PURPLE },
})

const st = StyleSheet.create({
  tile:    { width: '47%', backgroundColor: WHITE, borderRadius: 16, padding: 14, gap: 6, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  iconWrap:{ width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value:   { fontSize: 28, fontWeight: '900' },
  label:   { fontSize: 11, color: MUTED, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
})
