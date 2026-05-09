import React, { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, RefreshControl, ActivityIndicator, Linking, StatusBar,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { leadsApi } from '../services/api'
import DrawerMenu, { HamburgerBtn } from '../components/DrawerMenu'

const PURPLE = '#4a1a8a'
const BG     = '#f0f0f6'
const WHITE  = '#ffffff'
const TEXT   = '#1a1a2e'
const MUTED  = '#6b7280'

const TAG_COLORS = { HOT: '#ef4444', WARM: '#f59e0b', COLD: '#6366f1' }

const CATEGORIES = [
  { key: 'new',       label: 'New Leads',       subtitle: 'Not called yet',       icon: 'person-add-outline', color: '#3b82f6', bg: '#eff6ff', params: { never_called: 'true' } },
  { key: 'followup',  label: 'Follow-up',       subtitle: 'Scheduled callbacks',  icon: 'calendar-outline',   color: '#10b981', bg: '#f0fdf4', params: { follow_up_today: 'true' } },
  { key: 'notconn',   label: 'Not Connected',   subtitle: 'Cold leads',           icon: 'call-outline',       color: '#ef4444', bg: '#fef2f2', params: { lead_tag: 'COLD' } },
  { key: 'hot',       label: 'Hot Leads',       subtitle: 'Score > 80',           icon: 'flame-outline',      color: '#f59e0b', bg: '#fffbeb', params: { score_min: '80' } },
  { key: 'enrolled',  label: 'Enrolled',        subtitle: 'Converted leads',      icon: 'trophy-outline',     color: PURPLE,    bg: '#f5f3ff', params: { enrollment_stage: 'ENROLLED' } },
  { key: 'all',       label: 'All My Leads',    subtitle: 'Full lead list',       icon: 'people-outline',     color: '#6b7280', bg: WHITE,    params: {} },
]

function LeadCard({ lead, onPress }) {
  const tagColor = TAG_COLORS[lead.lead_tag] || TAG_COLORS.COLD
  const stageColors = { NEW: '#6366f1', COUNSELLING: '#f59e0b', APPLIED: '#3b82f6', PAYMENT_PENDING: '#f97316', ENROLLED: '#10b981' }
  const stageColor = stageColors[lead.enrollment_stage] || '#6366f1'
  return (
    <TouchableOpacity style={lc.card} onPress={onPress} activeOpacity={0.8}>
      <View style={lc.top}>
        <View style={[lc.avatar, { backgroundColor: PURPLE + '15' }]}>
          <Text style={[lc.avatarText, { color: PURPLE }]}>{lead.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={lc.name} numberOfLines={1}>{lead.name}</Text>
          <Text style={lc.sub} numberOfLines={1}>{lead.course_interested || lead.source}</Text>
        </View>
        <View style={[lc.tagPill, { backgroundColor: tagColor + '15' }]}>
          <Text style={[lc.tagText, { color: tagColor }]}>{lead.lead_tag || 'COLD'}</Text>
        </View>
      </View>
      <View style={lc.bottom}>
        <View style={[lc.stagePill, { backgroundColor: stageColor + '15' }]}>
          <Text style={[lc.stageText, { color: stageColor }]}>{lead.enrollment_stage || 'NEW'}</Text>
        </View>
        {lead.follow_up_date && (
          <View style={lc.followUp}>
            <Ionicons name="calendar-outline" size={11} color="#f59e0b" />
            <Text style={lc.followUpText}>{new Date(lead.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${lead.phone}`)} style={lc.callBtn}>
          <Ionicons name="call-outline" size={14} color={PURPLE} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL(`whatsapp://send?phone=${lead.phone.replace(/\D/g, '')}`)} style={[lc.callBtn, { marginLeft: 4 }]}>
          <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

function CategoryScreen({ category, navigation }) {
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['mob-cat-leads', category.key, search],
    queryFn: () => leadsApi.getAll({ page: 1, limit: 100, ...(search ? { search } : {}), ...category.params }).then(r => r.data),
    retry: 2,
  })
  const leads = data?.data || data?.leads || []

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={cl.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={cl.backBtn}>
          <Ionicons name="arrow-back" size={20} color={WHITE} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={cl.title}>{category.label}</Text>
          <Text style={cl.subtitle}>{leads.length} leads</Text>
        </View>
      </View>

      <View style={cl.searchBar}>
        <Ionicons name="search-outline" size={16} color={MUTED} />
        <TextInput
          style={cl.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, phone..."
          placeholderTextColor={MUTED}
        />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={MUTED} /></TouchableOpacity> : null}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={PURPLE} style={{ marginTop: 40 }} />
      ) : isError ? (
        <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
          <Ionicons name="wifi-outline" size={48} color="#d1d5db" />
          <Text style={{ color: MUTED, fontSize: 15 }}>Could not load leads</Text>
          <TouchableOpacity onPress={refetch} style={{ backgroundColor: PURPLE, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
            <Text style={{ color: WHITE, fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={l => l.id}
          renderItem={({ item }) => <LeadCard lead={item} onPress={() => navigation.navigate('LeadDetail', { leadId: item.id, leadName: item.name })} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 100, gap: 8 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text style={{ color: MUTED, marginTop: 10, fontSize: 15 }}>No leads in this category</Text>
              <Text style={{ color: '#9ca3af', marginTop: 4, fontSize: 13 }}>Pull down to refresh</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={PURPLE} colors={[PURPLE]} />}
        />
      )}

      <TouchableOpacity style={cl.fab} activeOpacity={0.9}>
        <Ionicons name="call" size={18} color={WHITE} />
        <Text style={cl.fabText}>Start Calling</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function LeadsScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState(null)
  const [showDrawer, setShowDrawer] = useState(false)

  if (activeCategory) {
    return <CategoryScreen category={activeCategory} navigation={{ ...navigation, goBack: () => setActiveCategory(null) }} />
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE} />
      <DrawerMenu visible={showDrawer} onClose={() => setShowDrawer(false)} navigation={navigation} currentScreen="My Leads" />
      {/* Header */}
      <View style={main.header}>
        <HamburgerBtn onPress={() => setShowDrawer(true)} />
        <Text style={[main.title, { flex: 1, marginLeft: 12 }]}>My Leads</Text>
        <TouchableOpacity style={main.addBtn} onPress={() => navigation.navigate('Dashboard')}>
          <Ionicons name="add" size={18} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* Category cards */}
      <FlatList
        data={CATEGORIES}
        keyExtractor={c => c.key}
        numColumns={2}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[cc.card, { backgroundColor: item.bg }]} onPress={() => setActiveCategory(item)} activeOpacity={0.85}>
            <View style={[cc.iconWrap, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={[cc.label, { color: item.color }]}>{item.label}</Text>
            <Text style={cc.subtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const main = StyleSheet.create({
  header: { backgroundColor: PURPLE, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:  { fontSize: 22, fontWeight: '800', color: WHITE },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
})

const cc = StyleSheet.create({
  card:     { flex: 1, backgroundColor: WHITE, borderRadius: 16, padding: 16, gap: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label:    { fontSize: 14, fontWeight: '800' },
  subtitle: { fontSize: 12, color: MUTED },
})

const lc = StyleSheet.create({
  card:       { backgroundColor: WHITE, borderRadius: 14, padding: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  top:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800' },
  name:       { fontSize: 14, fontWeight: '700', color: TEXT },
  sub:        { fontSize: 12, color: MUTED },
  tagPill:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  tagText:    { fontSize: 11, fontWeight: '800' },
  bottom:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stagePill:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  stageText:  { fontSize: 10, fontWeight: '700' },
  followUp:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  followUpText: { fontSize: 10, color: '#f59e0b', fontWeight: '600' },
  callBtn:    { width: 30, height: 30, borderRadius: 8, backgroundColor: PURPLE + '10', alignItems: 'center', justifyContent: 'center' },
})

const cl = StyleSheet.create({
  header:     { backgroundColor: PURPLE, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 18, fontWeight: '800', color: WHITE },
  subtitle:   { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  searchBar:  { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 12, backgroundColor: WHITE, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  searchInput:{ flex: 1, fontSize: 14, color: TEXT },
  fab:        { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: PURPLE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, elevation: 8, shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
  fabText:    { color: WHITE, fontSize: 14, fontWeight: '800' },
})
