import React, { useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Share, Linking, RefreshControl, ActivityIndicator,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { callsApi } from '../services/api'

const NAVY   = '#0f172a'
const ACCENT = '#4f46e5'
const BG     = '#f8fafc'

const STATS = [
  { key: 'total_calls',     label: 'Total Calls',    icon: 'call-outline',             color: ACCENT },
  { key: 'connected_calls', label: 'Connected',      icon: 'checkmark-circle-outline', color: '#10b981' },
  { key: 'missed_calls',    label: 'Missed',         icon: 'close-circle-outline',     color: '#ef4444' },
  { key: 'total_duration',  label: 'Duration (min)', icon: 'timer-outline',            color: '#f59e0b', suffix: ' min' },
  { key: 'leads_converted', label: 'Converted',      icon: 'trending-up-outline',      color: '#10b981' },
  { key: 'new_leads',       label: 'New Leads',      icon: 'person-add-outline',       color: ACCENT },
  { key: 'whatsapp_sent',   label: 'WhatsApp Sent',  icon: 'logo-whatsapp',            color: '#25D366' },
]

function buildText(data) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  return [
    `Daily Report — ${today}`,
    '',
    'Calls',
    `Total: ${data.total_calls}`,
    `Connected: ${data.connected_calls}`,
    `Missed: ${data.missed_calls}`,
    `Duration: ${data.total_duration} min`,
    '',
    'Leads',
    `Converted: ${data.leads_converted}`,
    `New: ${data.new_leads}`,
    '',
    `WhatsApp Sent: ${data.whatsapp_sent}`,
    '',
    '— EduCRM',
  ].join('\n')
}

export default function DailyReportScreen({ navigation }) {
  const { data, isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ['mob-daily-report'],
    queryFn: () => callsApi.today().then(r => r.data),
    refetchInterval: 60000,
    retry: 1,
  })

  const handleShare = useCallback(async () => {
    if (!data) return
    try { await Share.share({ message: buildText(data) }) } catch {}
  }, [data])

  const handleWhatsApp = useCallback(() => {
    if (!data) return
    const text = encodeURIComponent(buildText(data))
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() =>
      Linking.openURL(`https://wa.me/?text=${text}`)
    )
  }, [data])

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <ScrollView
      style={dr.root}
      contentContainerStyle={dr.container}
      refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={ACCENT} />}
    >
      {/* Header */}
      <View style={dr.pageHeader}>
        <View>
          <Text style={dr.pageTitle}>Daily Report</Text>
          <Text style={dr.pageDate}>{today}</Text>
        </View>
        <TouchableOpacity
          style={dr.settingsBtn}
          onPress={() => navigation.navigate('CallSettings')}
        >
          <Ionicons name="settings-outline" size={22} color="#64748b" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={dr.center}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={dr.loadingText}>Loading report...</Text>
        </View>
      ) : error ? (
        <View style={dr.center}>
          <Ionicons name="warning-outline" size={40} color="#ef4444" />
          <Text style={dr.errorText}>Could not load report</Text>
          <TouchableOpacity style={dr.retryBtn} onPress={refetch}>
            <Text style={dr.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : data ? (
        <>
          {/* Stats grid */}
          <View style={dr.grid}>
            {STATS.map(({ key, label, icon, color, suffix = '' }) => (
              <View key={key} style={dr.statCard}>
                <View style={[dr.statIcon, { backgroundColor: color + '18' }]}>
                  <Ionicons name={icon} size={20} color={color} />
                </View>
                <Text style={[dr.statValue, { color }]}>{data[key] ?? 0}{suffix}</Text>
                <Text style={dr.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={dr.actions}>
            <TouchableOpacity style={[dr.actionBtn, { backgroundColor: NAVY }]} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={18} color="white" />
              <Text style={dr.actionText}>Share Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[dr.actionBtn, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={18} color="white" />
              <Text style={dr.actionText}>Send WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={dr.preview}>
            <Text style={dr.previewLabel}>REPORT PREVIEW</Text>
            <Text style={dr.previewText}>{buildText(data)}</Text>
          </View>
        </>
      ) : (
        <View style={dr.center}>
          <Ionicons name="bar-chart-outline" size={48} color="#cbd5e1" />
          <Text style={dr.emptyText}>No data yet. Log some calls first!</Text>
        </View>
      )}
    </ScrollView>
  )
}

const dr = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },
  container:   { padding: 16, paddingBottom: 40 },
  pageHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  pageTitle:   { fontSize: 22, fontWeight: '800', color: NAVY },
  pageDate:    { fontSize: 13, color: '#64748b', marginTop: 2 },
  settingsBtn: { padding: 8, backgroundColor: '#ffffff', borderRadius: 10, elevation: 1 },
  center:      { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { fontSize: 14, color: '#64748b', marginTop: 10 },
  errorText:   { fontSize: 14, color: '#ef4444', marginTop: 10 },
  emptyText:   { fontSize: 14, color: '#94a3b8', marginTop: 10, textAlign: 'center', maxWidth: 240 },
  retryBtn:    { marginTop: 12, backgroundColor: ACCENT, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:   { color: '#ffffff', fontWeight: '700' },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard:    { width: '47%', backgroundColor: '#ffffff', borderRadius: 16, padding: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3 },
  statIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue:   { fontSize: 26, fontWeight: '800' },
  statLabel:   { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
  actions:     { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  actionText:  { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  preview:     { backgroundColor: NAVY, borderRadius: 16, padding: 16 },
  previewLabel:{ fontSize: 10, color: '#64748b', fontWeight: '700', letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' },
  previewText: { fontSize: 13, color: '#94a3b8', lineHeight: 22, fontFamily: 'monospace' },
})
