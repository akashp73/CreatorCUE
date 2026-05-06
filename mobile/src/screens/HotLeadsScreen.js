import React, { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Linking, RefreshControl,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { dashboardApi } from '../services/api'

const NAVY = '#1B2B4B'

function HotLeadCard({ lead, onPress }) {
  const daysAgo = lead.last_activity_at
    ? Math.floor((Date.now() - new Date(lead.last_activity_at)) / 86400000)
    : null
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{lead.name}</Text>
          <Text style={s.sub}>{lead.course_interested || 'No course'} · {lead.city || 'Unknown'}</Text>
        </View>
        <View style={s.scoreBox}>
          <Text style={s.scoreNum}>{lead.activity_score}</Text>
          <Text style={s.scoreFire}>🔥</Text>
        </View>
      </View>
      {daysAgo !== null && (
        <Text style={s.activity}>Last active: {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}</Text>
      )}
      <View style={s.btnRow}>
        <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${lead.phone}`)}>
          <MaterialCommunityIcons name="phone" size={16} color="white" />
          <Text style={s.btnText}>CALL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.waBtn} onPress={() => Linking.openURL(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`)}>
          <MaterialCommunityIcons name="whatsapp" size={16} color="white" />
          <Text style={s.btnText}>WHATSAPP</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

export default function HotLeadsScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false)
  const { data: leads = [], refetch } = useQuery({
    queryKey: ['mob-hot-full'],
    queryFn: () => dashboardApi.getHotLeads().then(r => r.data),
  })

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false) }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🔥 Hot Leads</Text>
        <View style={s.countBadge}><Text style={s.countText}>{leads.length}</Text></View>
      </View>
      <FlatList
        data={leads}
        keyExtractor={l => l.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E53E3E" />}
        renderItem={({ item }) => (
          <HotLeadCard lead={item} onPress={() => navigation.navigate('LeadDetail', { leadId: item.id, leadName: item.name })} />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🎯</Text>
            <Text style={s.emptyText}>No hot leads right now</Text>
          </View>
        }
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FC' },
  header: { backgroundColor: '#1A202C', padding: 16, paddingTop: 50, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', flex: 1 },
  countBadge: { backgroundColor: '#E53E3E', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#E53E3E', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  sub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  scoreBox: { alignItems: 'center' },
  scoreNum: { fontSize: 36, fontWeight: 'black', color: '#E53E3E', lineHeight: 40 },
  scoreFire: { fontSize: 14, textAlign: 'center' },
  activity: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 8 },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: NAVY, borderRadius: 10, paddingVertical: 10 },
  waBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#25D366', borderRadius: 10, paddingVertical: 10 },
  btnText: { color: 'white', fontWeight: '700', fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
})
