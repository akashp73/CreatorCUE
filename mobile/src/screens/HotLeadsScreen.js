import React, { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Linking, RefreshControl, ActivityIndicator,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { dashboardApi } from '../services/api'

const NAVY   = '#0f172a'
const ACCENT = '#4f46e5'
const HOT    = '#ef4444'
const BG     = '#f8fafc'

function HotLeadCard({ lead, onPress }) {
  const daysAgo = lead.last_activity_at
    ? Math.floor((Date.now() - new Date(lead.last_activity_at)) / 86400000)
    : null
  const score = lead.activity_score || 0

  return (
    <TouchableOpacity style={hs.card} onPress={onPress} activeOpacity={0.8}>
      {/* Top row */}
      <View style={hs.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={hs.name} numberOfLines={1}>{lead.name}</Text>
          <Text style={hs.sub} numberOfLines={1}>
            {lead.course_interested || 'No course'}{lead.city ? ` · ${lead.city}` : ''}
          </Text>
          {daysAgo !== null && (
            <View style={hs.activityRow}>
              <Ionicons name="time-outline" size={12} color="#94a3b8" />
              <Text style={hs.activityText}>
                {daysAgo === 0 ? 'Active today' : `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}
              </Text>
            </View>
          )}
        </View>

        {/* Score bubble */}
        <View style={hs.scoreWrap}>
          <Text style={hs.scoreNum}>{score}</Text>
          <View style={hs.scoreLabel}>
            <Ionicons name="flame" size={10} color={HOT} />
            <Text style={hs.scoreLabelText}>HOT</Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={hs.btnRow}>
        <TouchableOpacity
          style={[hs.btn, { backgroundColor: NAVY }]}
          onPress={() => Linking.openURL(`tel:${lead.phone}`)}
        >
          <Ionicons name="call-outline" size={15} color="white" />
          <Text style={hs.btnText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[hs.btn, { backgroundColor: '#25D366' }]}
          onPress={() => Linking.openURL(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`)}
        >
          <Ionicons name="logo-whatsapp" size={15} color="white" />
          <Text style={hs.btnText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[hs.btn, { backgroundColor: ACCENT }]}
          onPress={onPress}
        >
          <Ionicons name="person-outline" size={15} color="white" />
          <Text style={hs.btnText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

export default function HotLeadsScreen({ navigation }) {
  const [refreshing, setRef] = useState(false)
  const { data: leads = [], isLoading, refetch, error } = useQuery({
    queryKey: ['mob-hot-full'],
    queryFn: () => dashboardApi.getHotLeads().then(r => r.data),
  })

  const sorted = [...leads].sort((a, b) => b.activity_score - a.activity_score)
  const onRefresh = async () => { setRef(true); await refetch(); setRef(false) }

  return (
    <View style={hs.root}>
      {/* Header */}
      <View style={hs.header}>
        <View>
          <Text style={hs.headerTitle}>Hot Leads</Text>
          <Text style={hs.headerSub}>Score above 80</Text>
        </View>
        <View style={hs.countBadge}>
          <Ionicons name="flame" size={14} color={HOT} />
          <Text style={hs.countText}>{leads.length}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={hs.center}><ActivityIndicator size="large" color={HOT} /></View>
      ) : error ? (
        <View style={hs.center}>
          <Ionicons name="warning-outline" size={40} color="#ef4444" />
          <Text style={hs.errorText}>Failed to load</Text>
          <TouchableOpacity style={hs.retryBtn} onPress={refetch}>
            <Text style={hs.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={l => l.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={HOT} />}
          renderItem={({ item }) => (
            <HotLeadCard
              lead={item}
              onPress={() => navigation.navigate('LeadDetail', { leadId: item.id, leadName: item.name })}
            />
          )}
          ListEmptyComponent={
            <View style={hs.center}>
              <Ionicons name="flame-outline" size={48} color="#cbd5e1" />
              <Text style={hs.emptyTitle}>No hot leads</Text>
              <Text style={hs.emptyText}>Leads with score above 80 appear here</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const hs = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG },
  header:        { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle:   { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  headerSub:     { fontSize: 12, color: '#64748b', marginTop: 2 },
  countBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: HOT + '20', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  countText:     { color: HOT, fontSize: 14, fontWeight: '800' },
  card:          { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: HOT, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  cardTop:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  name:          { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  sub:           { fontSize: 12, color: '#64748b', marginTop: 3 },
  activityRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  activityText:  { fontSize: 11, color: '#94a3b8' },
  scoreWrap:     { alignItems: 'center', paddingLeft: 12 },
  scoreNum:      { fontSize: 40, fontWeight: '800', color: HOT, lineHeight: 44 },
  scoreLabel:    { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  scoreLabelText:{ fontSize: 11, fontWeight: '700', color: HOT },
  btnRow:        { flexDirection: 'row', gap: 8 },
  btn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 10, paddingVertical: 10 },
  btnText:       { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle:    { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 12 },
  emptyText:     { fontSize: 13, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
  errorText:     { fontSize: 14, color: '#ef4444', marginTop: 10 },
  retryBtn:      { marginTop: 12, backgroundColor: ACCENT, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:     { color: '#ffffff', fontWeight: '700' },
})
