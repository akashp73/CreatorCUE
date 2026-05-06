import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { dashboardApi } from '../services/api'
import useAuthStore from '../store/authStore'

const NAVY = '#1B2B4B', SAFFRON = '#F6AD2B'
const { width } = Dimensions.get('window')

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={[s.statIcon, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View>
        <Text style={s.statLabel}>{label}</Text>
        <Text style={[s.statValue, { color }]}>{value ?? '—'}</Text>
      </View>
    </View>
  )
}

function HotLeadCard({ lead, onPress }) {
  return (
    <TouchableOpacity style={s.hotCard} onPress={onPress} activeOpacity={0.85}>
      <Text style={s.hotName} numberOfLines={1}>{lead.name}</Text>
      <Text style={s.hotScore}>{lead.activity_score}</Text>
      <Text style={s.hotFire}>🔥</Text>
      <TouchableOpacity style={s.callBtn} onPress={() => { /* Linking.openURL */ }}>
        <MaterialCommunityIcons name="phone" size={14} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

export default function DashboardScreen({ navigation }) {
  const user = useAuthStore(s => s.user)

  const { data: stats, isLoading: sl, refetch: refetchStats } = useQuery({
    queryKey: ['mob-stats'], queryFn: () => dashboardApi.getStats().then(r => r.data),
  })
  const { data: hotLeads = [], isLoading: hl, refetch: refetchHot } = useQuery({
    queryKey: ['mob-hot'], queryFn: () => dashboardApi.getHotLeads().then(r => r.data),
  })

  const [refreshing, setRefreshing] = React.useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchStats(), refetchHot()])
    setRefreshing(false)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SAFFRON} />}
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.greeting}>{greeting}, {user?.name?.split(' ')[0]} 👋</Text>
        <Text style={s.headerSub}>Here's your CRM overview</Text>
      </View>

      {/* Stat cards 2×2 grid */}
      <View style={s.grid}>
        <View style={s.gridRow}>
          <StatCard icon="account-group" label="My Leads" value={stats?.total_leads} color={NAVY} />
          <StatCard icon="fire" label="Hot Leads 🔥" value={stats?.hot_leads} color="#E53E3E" />
        </View>
        <View style={s.gridRow}>
          <StatCard icon="checkbox-marked-circle" label="Tasks Today" value={stats?.tasks_due_today} color="#DD6B20" />
          <StatCard icon="trending-up" label="Enrolled" value={stats?.enrolled_this_month} color="#38A169" />
        </View>
      </View>

      {/* Hot leads horizontal scroll */}
      {hotLeads.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>🔥 Hot Leads</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hotScroll}>
            {hotLeads.slice(0, 8).map(lead => (
              <HotLeadCard
                key={lead.id}
                lead={lead}
                onPress={() => navigation.navigate('LeadDetail', { leadId: lead.id, leadName: lead.name })}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FC' },
  content: { paddingBottom: 20 },
  header: { backgroundColor: NAVY, padding: 20, paddingTop: 50 },
  greeting: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSub: { fontSize: 13, color: '#93C5FD', marginTop: 4 },
  grid: { padding: 16, gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  statIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  statValue: { fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  hotScroll: { paddingRight: 16, gap: 10 },
  hotCard: { width: 130, backgroundColor: 'white', borderRadius: 14, padding: 14, alignItems: 'center', borderTopWidth: 3, borderTopColor: '#E53E3E', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  hotName: { fontSize: 12, fontWeight: '600', color: '#1F2937', textAlign: 'center', marginBottom: 6 },
  hotScore: { fontSize: 28, fontWeight: 'black', color: '#E53E3E', lineHeight: 32 },
  hotFire: { fontSize: 16 },
  callBtn: { marginTop: 8, backgroundColor: '#38A169', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
})
