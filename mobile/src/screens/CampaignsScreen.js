import React from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import apiDefault from '../services/api'

const PURPLE = '#4a1a8a'
const BG     = '#f0f0f6'
const WHITE  = '#ffffff'
const TEXT   = '#1a1a2e'
const MUTED  = '#6b7280'

function CampaignCard({ campaign, onPress }) {
  const STATUS_COLORS = { DRAFT: '#9ca3af', ACTIVE: '#10b981', COMPLETED: '#6366f1', PAUSED: '#f59e0b' }
  const statusColor = STATUS_COLORS[campaign.status] || '#9ca3af'

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.cardHeader}>
        <View style={s.cardTitleRow}>
          <View style={s.iconWrap}>
            <Ionicons name="megaphone-outline" size={18} color={PURPLE} />
          </View>
          <Text style={s.cardTitle} numberOfLines={1}>{campaign.name}</Text>
        </View>
        <View style={[s.statusPill, { backgroundColor: statusColor + '15' }]}>
          <Text style={[s.statusText, { color: statusColor }]}>{campaign.status}</Text>
        </View>
      </View>

      <View style={s.statsGrid}>
        {[
          { label: 'Channel', value: campaign.channel, icon: 'send-outline', color: '#3b82f6' },
          { label: 'Sent', value: campaign.sent_count || 0, icon: 'checkmark-circle-outline', color: '#10b981' },
        ].map((stat, i) => (
          <View key={i} style={s.statItem}>
            <Ionicons name={stat.icon} size={14} color={stat.color} />
            <Text style={s.statValue} numberOfLines={1}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.viewBtn} onPress={onPress}>
        <Ionicons name="people-outline" size={14} color={PURPLE} />
        <Text style={s.viewBtnText}>View Leads</Text>
        <Ionicons name="chevron-forward" size={14} color={PURPLE} />
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

export default function CampaignsScreen({ navigation }) {
  const { data: campaigns = [], isLoading, refetch } = useQuery({
    queryKey: ['mob-campaigns'],
    queryFn: () => apiDefault.get('/campaigns').then(r => r.data),
  })

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

      {/* Header */}
      <View style={h.header}>
        <Text style={h.title}>My Campaigns</Text>
        <Text style={h.sub}>{campaigns.length} campaigns</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={PURPLE} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={c => c.id}
          renderItem={({ item }) => <CampaignCard campaign={item} onPress={() => navigation.navigate('My Leads')} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 32, gap: 10 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={PURPLE} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="megaphone-outline" size={48} color="#d1d5db" />
              <Text style={{ color: MUTED, marginTop: 10, fontSize: 15 }}>No campaigns yet</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const h = StyleSheet.create({
  header: { backgroundColor: PURPLE, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20 },
  title:  { fontSize: 22, fontWeight: '800', color: WHITE },
  sub:    { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
})

const s = StyleSheet.create({
  card:        { backgroundColor: WHITE, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconWrap:    { width: 36, height: 36, borderRadius: 10, backgroundColor: PURPLE + '15', alignItems: 'center', justifyContent: 'center' },
  cardTitle:   { fontSize: 15, fontWeight: '700', color: TEXT, flex: 1 },
  statusPill:  { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, flexShrink: 0 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  statsGrid:   { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statItem:    { flex: 1, alignItems: 'center', gap: 3 },
  statValue:   { fontSize: 16, fontWeight: '800', color: TEXT },
  statLabel:   { fontSize: 10, color: MUTED, fontWeight: '600' },
  viewBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: PURPLE + '10' },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: PURPLE, flex: 1, textAlign: 'center' },
})
