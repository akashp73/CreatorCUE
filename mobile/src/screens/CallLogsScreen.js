import React, { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, RefreshControl,
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

const OUTCOME_COLORS = { INTERESTED: SUCCESS, NOT_INTERESTED: DANGER, BUSY: GOLD, NO_ANSWER: MUTED, CALLBACK: PURPLE, CONVERTED: SUCCESS, CONNECTED: SUCCESS }
const OUTCOME_LABELS = { INTERESTED: 'Interested', NOT_INTERESTED: 'Not Interested', BUSY: 'Busy', NO_ANSWER: 'No Answer', CALLBACK: 'Callback', CONVERTED: 'Converted', CONNECTED: 'Connected' }
const TYPE_COLORS = { OUTGOING: PURPLE, INCOMING: SUCCESS, MISSED: DANGER }

function formatDuration(mins) {
  if (!mins) return '—'
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function SummaryBar({ data }) {
  if (!data) return null
  return (
    <View style={sum.bar}>
      {[
        { label: 'Total', val: data.total_calls || 0, color: PURPLE },
        { label: 'Connected', val: data.connected_calls || 0, color: SUCCESS },
        { label: 'Missed', val: data.missed_calls || 0, color: DANGER },
        { label: 'Talk Time', val: `${data.total_duration || 0}m`, color: GOLD },
      ].map((s, i) => (
        <View key={i} style={[sum.item, i > 0 && { borderLeftWidth: 1, borderLeftColor: '#e5e7eb' }]}>
          <Text style={[sum.val, { color: s.color }]}>{s.val}</Text>
          <Text style={sum.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  )
}

function CallRow({ call, onPress }) {
  const typeColor = TYPE_COLORS[call.call_type] || PURPLE
  const outcomeColor = OUTCOME_COLORS[call.outcome] || MUTED
  return (
    <TouchableOpacity style={cr.row} onPress={onPress} activeOpacity={0.8}>
      <View style={[cr.typeIcon, { backgroundColor: typeColor + '15' }]}>
        <Ionicons name="call-outline" size={16} color={typeColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={cr.name} numberOfLines={1}>{call.lead?.name || 'Unknown'}</Text>
        <Text style={cr.phone}>{call.lead?.phone || '—'}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <View style={[cr.outcomePill, { backgroundColor: outcomeColor + '15' }]}>
          <Text style={[cr.outcomeText, { color: outcomeColor }]}>{OUTCOME_LABELS[call.outcome] || call.outcome}</Text>
        </View>
        <Text style={cr.time}>{formatDuration(call.duration)} · {new Date(call.called_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function CallLogsScreen({ navigation }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const { data: report, isLoading: rl, refetch: rr } = useQuery({ queryKey: ['mob-daily-report'], queryFn: () => callsApi.today().then(r => r.data) })
  const { data: callsData, isLoading: cl, refetch: cr } = useQuery({ queryKey: ['mob-calls-today'], queryFn: () => callsApi.today().then(r => r.data) })

  const calls = callsData?.calls || []

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

      {/* Header */}
      <View style={h.header}>
        <View style={{ flex: 1 }}>
          <Text style={h.title}>Call Logs</Text>
          <Text style={h.sub}>{new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <TouchableOpacity style={h.refreshBtn} onPress={() => { rr(); cr() }}>
          <Ionicons name="refresh-outline" size={18} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      {rl ? null : <SummaryBar data={report} />}

      {/* Call list */}
      {cl ? (
        <ActivityIndicator size="large" color={PURPLE} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={calls}
          keyExtractor={c => c.id}
          renderItem={({ item }) => <CallRow call={item} onPress={() => item.lead?.id && navigation.navigate('LeadDetail', { leadId: item.lead.id, leadName: item.lead.name })} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 32, gap: 6 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => { rr(); cr() }} tintColor={PURPLE} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="call-outline" size={48} color="#d1d5db" />
              <Text style={{ color: MUTED, marginTop: 10, fontSize: 15 }}>No calls logged today</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const h = StyleSheet.create({
  header:     { backgroundColor: PURPLE, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20, flexDirection: 'row', alignItems: 'center' },
  title:      { fontSize: 22, fontWeight: '800', color: WHITE },
  sub:        { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
})

const sum = StyleSheet.create({
  bar:   { flexDirection: 'row', backgroundColor: WHITE, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  item:  { flex: 1, alignItems: 'center', paddingVertical: 4 },
  val:   { fontSize: 20, fontWeight: '900' },
  label: { fontSize: 10, color: MUTED, fontWeight: '600', marginTop: 2 },
})

const cr = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: WHITE, borderRadius: 14, padding: 14 },
  typeIcon:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name:        { fontSize: 14, fontWeight: '700', color: TEXT },
  phone:       { fontSize: 12, color: MUTED },
  outcomePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  outcomeText: { fontSize: 10, fontWeight: '700' },
  time:        { fontSize: 11, color: MUTED },
})
