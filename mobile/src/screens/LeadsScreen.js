import React, { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, RefreshControl, ActivityIndicator, Linking,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { leadsApi } from '../services/api'

const NAVY   = '#0f172a'
const ACCENT = '#4f46e5'
const BG     = '#f8fafc'

const SCORE_COLOR = (label) =>
  label === 'HOT' ? '#ef4444' : label === 'WARM' ? '#f59e0b' : '#3b82f6'

const STATUS_COLOR = {
  NEW: '#64748b', CONTACTED: '#3b82f6', APPLIED: '#f59e0b',
  QUALIFIED: ACCENT, ENROLLED: '#10b981', LOST: '#ef4444',
}

const FILTER_CHIPS = ['All', 'NEW', 'CONTACTED', 'APPLIED', 'QUALIFIED', 'ENROLLED']

function ScoreBadge({ score, label }) {
  const color = SCORE_COLOR(label)
  return (
    <View style={[ls.badge, { backgroundColor: color + '15' }]}>
      <View style={[ls.dot, { backgroundColor: color }]} />
      <Text style={[ls.badgeText, { color }]}>{score} {label}</Text>
    </View>
  )
}

function LeadCard({ lead, onPress }) {
  const daysAgo = lead.last_activity_at
    ? Math.floor((Date.now() - new Date(lead.last_activity_at)) / 86400000)
    : null
  const statusColor = STATUS_COLOR[lead.status] || '#64748b'

  return (
    <TouchableOpacity style={ls.card} onPress={onPress} activeOpacity={0.8}>
      <View style={ls.cardTop}>
        <View style={ls.avatarWrap}>
          <Text style={ls.avatarText}>{lead.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ls.name} numberOfLines={1}>{lead.name}</Text>
          <TouchableOpacity onPress={e => { e.stopPropagation(); Linking.openURL(`tel:${lead.phone}`) }}>
            <Text style={ls.phone}>{lead.phone}</Text>
          </TouchableOpacity>
        </View>
        <ScoreBadge score={lead.activity_score} label={lead.score_label || 'COLD'} />
      </View>

      <View style={ls.cardBottom}>
        {lead.course_interested ? (
          <View style={ls.chip}>
            <Ionicons name="book-outline" size={10} color="#64748b" />
            <Text style={ls.chipText} numberOfLines={1}>{lead.course_interested}</Text>
          </View>
        ) : null}
        <View style={[ls.chip, { backgroundColor: statusColor + '15' }]}>
          <Text style={[ls.chipText, { color: statusColor }]}>{lead.status}</Text>
        </View>
        <View style={ls.chip}>
          <Text style={ls.chipText}>{lead.source}</Text>
        </View>
        {daysAgo !== null && (
          <Text style={ls.activity}>{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function LeadsScreen({ navigation }) {
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('All')
  const [refreshing, setRef]  = useState(false)

  const params = {
    search: search.trim() || undefined,
    status: filter !== 'All' ? filter : undefined,
    page: 1, limit: 50,
  }

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['mob-leads', params],
    queryFn: () => leadsApi.getAll(params).then(r => r.data),
  })

  const leads = data?.leads || data?.data || []
  const total = data?.pagination?.total || leads.length

  const onRefresh = async () => { setRef(true); await refetch(); setRef(false) }

  return (
    <View style={ls.root}>
      {/* Header */}
      <View style={ls.header}>
        <Text style={ls.headerTitle}>My Leads</Text>
        <View style={ls.countBadge}>
          <Text style={ls.countText}>{total}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={ls.searchRow}>
        <View style={ls.searchBox}>
          <Ionicons name="search-outline" size={16} color="#94a3b8" />
          <TextInput
            style={ls.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search name or phone..."
            placeholderTextColor="#94a3b8"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        data={FILTER_CHIPS}
        keyExtractor={i => i}
        contentContainerStyle={ls.chips}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[ls.filterChip, filter === item && ls.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[ls.filterText, filter === item && ls.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* List */}
      {isLoading ? (
        <View style={ls.center}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : error ? (
        <View style={ls.center}>
          <Ionicons name="warning-outline" size={40} color="#ef4444" />
          <Text style={ls.errorText}>Failed to load leads</Text>
          <TouchableOpacity style={ls.retryBtn} onPress={refetch}>
            <Text style={ls.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={l => l.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              onPress={() => navigation.navigate('LeadDetail', { leadId: item.id, leadName: item.name })}
            />
          )}
          ListEmptyComponent={
            <View style={ls.center}>
              <Ionicons name="people-outline" size={48} color="#cbd5e1" />
              <Text style={ls.emptyText}>No leads found</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const ls = StyleSheet.create({
  root:            { flex: 1, backgroundColor: BG },
  header:          { backgroundColor: NAVY, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
  headerTitle:     { fontSize: 20, fontWeight: '800', color: '#ffffff', flex: 1 },
  countBadge:      { backgroundColor: ACCENT, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  countText:       { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  searchRow:       { paddingHorizontal: 12, paddingVertical: 10 },
  searchBox:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  searchInput:     { flex: 1, fontSize: 14, color: '#0f172a' },
  chips:           { paddingHorizontal: 12, paddingBottom: 6, gap: 8 },
  filterChip:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipActive:{ backgroundColor: ACCENT, borderColor: ACCENT },
  filterText:      { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterTextActive:{ color: '#ffffff' },
  card:            { backgroundColor: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
  cardTop:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatarWrap:      { width: 40, height: 40, borderRadius: 20, backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:      { fontSize: 16, fontWeight: '700', color: ACCENT },
  name:            { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  phone:           { fontSize: 13, color: ACCENT, marginTop: 1, fontFamily: 'monospace', textDecorationLine: 'underline' },
  badge:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  dot:             { width: 5, height: 5, borderRadius: 3 },
  badgeText:       { fontSize: 11, fontWeight: '700' },
  cardBottom:      { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  chip:            { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#f1f5f9' },
  chipText:        { fontSize: 11, fontWeight: '600', color: '#475569' },
  activity:        { fontSize: 11, color: '#94a3b8', marginLeft: 'auto' },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText:       { fontSize: 14, color: '#94a3b8', marginTop: 10 },
  errorText:       { fontSize: 14, color: '#ef4444', marginTop: 10 },
  retryBtn:        { marginTop: 12, backgroundColor: ACCENT, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:       { color: '#ffffff', fontWeight: '700' },
})
