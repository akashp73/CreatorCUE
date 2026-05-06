import React, { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, RefreshControl, ActivityIndicator,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { leadsApi } from '../services/api'

const NAVY = '#1B2B4B', SAFFRON = '#F6AD2B'
const SCORE_COLOR = (label) => label === 'HOT' ? '#E53E3E' : label === 'WARM' ? '#DD6B20' : '#3182CE'
const FILTER_CHIPS = ['All', 'New', 'Contacted', 'Applied', 'Qualified']

function ScoreBadge({ score, label }) {
  const color = SCORE_COLOR(label)
  return (
    <View style={[s.badge, { backgroundColor: color + '18', borderColor: color + '40', borderWidth: 1 }]}>
      <View style={[s.badgeDot, { backgroundColor: color }]} />
      <Text style={[s.badgeText, { color }]}>{score} {label}</Text>
    </View>
  )
}

function LeadCard({ lead, onPress }) {
  const daysAgo = lead.last_activity_at
    ? Math.floor((Date.now() - new Date(lead.last_activity_at)) / 86400000)
    : null

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.cardTop}>
        <View style={s.cardLeft}>
          <Text style={s.name} numberOfLines={1}>{lead.name}</Text>
          <Text style={s.phone}>{lead.phone}</Text>
        </View>
        <ScoreBadge score={lead.activity_score} label={lead.score_label} />
      </View>
      <View style={s.cardBottom}>
        <View style={[s.chip, { backgroundColor: '#EEF2FF' }]}>
          <Text style={[s.chipText, { color: '#4F46E5' }]}>{lead.course_interested || 'No course'}</Text>
        </View>
        <View style={[s.chip, { backgroundColor: '#F0FFF4' }]}>
          <Text style={[s.chipText, { color: '#276749' }]}>{lead.status}</Text>
        </View>
        <View style={[s.chip, { backgroundColor: '#FFF5F5' }]}>
          <Text style={[s.chipText, { color: '#9B2C2C' }]}>{lead.source}</Text>
        </View>
        {daysAgo !== null && (
          <Text style={s.activity}>{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function LeadsScreen({ navigation }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  const params = {
    search: search || undefined,
    status: filter !== 'All' ? filter.toUpperCase() : undefined,
    page, limit: 20,
  }

  const { data, isLoading, refetch, isFetchingNextPage } = useQuery({
    queryKey: ['mob-leads', params],
    queryFn: () => leadsApi.getAll(params).then(r => r.data),
  })

  const leads = data?.leads || data?.data || []

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Leads</Text>
        <Text style={s.headerSub}>{data?.pagination?.total || leads.length} total</Text>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, phone..."
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
        />
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        data={FILTER_CHIPS}
        keyExtractor={i => i}
        contentContainerStyle={s.chips}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.filterChip, filter === item && s.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[s.filterChipText, filter === item && s.filterChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Leads list */}
      {isLoading ? (
        <View style={s.center}><ActivityIndicator size="large" color={NAVY} /></View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={l => l.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SAFFRON} />}
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              onPress={() => navigation.navigate('LeadDetail', { leadId: item.id, leadName: item.name })}
            />
          )}
          ListEmptyComponent={
            <View style={s.center}>
              <MaterialCommunityIcons name="account-search" size={48} color="#D1D5DB" />
              <Text style={s.emptyText}>No leads found</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FC' },
  header: { backgroundColor: NAVY, padding: 16, paddingTop: 50 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSub: { fontSize: 12, color: '#93C5FD', marginTop: 2 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', margin: 12, backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
  chips: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  filterChipTextActive: { color: 'white' },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardLeft: { flex: 1, marginRight: 12 },
  name: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  phone: { fontSize: 12, color: '#6B7280', marginTop: 2, fontFamily: 'monospace' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  chipText: { fontSize: 11, fontWeight: '600' },
  activity: { fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
})
