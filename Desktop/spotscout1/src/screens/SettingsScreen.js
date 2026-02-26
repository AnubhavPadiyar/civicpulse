import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, shadow } from '../components/theme';
import { getStudent, getBookings } from '../data/storage';

export default function SettingsScreen({ onReset }) {
  const [student, setStudent]   = useState(null);
  const [bookings, setBookings] = useState([]);

  useFocusEffect(useCallback(() => {
    getStudent().then(setStudent);
    getBookings().then(setBookings);
  }, []));

  const handleReset = () => {
    Alert.alert('Clear All Data', 'This will remove your profile and all bookings. Are you sure?', [
      { text: 'Cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        await AsyncStorage.clear();
        onReset();
      }}
    ]);
  };

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[colors.navy, colors.navyLight]} style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{student?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.headerName}>{student?.name || 'Student'}</Text>
        <Text style={styles.headerErp}>{student?.erpId || ''}</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{student?.department} · {student?.year} · Sec {student?.section}</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>

        {/* Stats */}
        <View style={[styles.statsRow, shadow]}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{bookings.length}</Text>
            <Text style={styles.statLbl}>Bookings</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statNum}>5</Text>
            <Text style={styles.statLbl}>Libraries</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>GEHU</Text>
            <Text style={styles.statLbl}>Campus</Text>
          </View>
        </View>

        {/* Profile Details */}
        <View style={[styles.card, shadow]}>
          <Text style={styles.cardTitle}>Profile Details</Text>
          <InfoRow label="Full Name"   value={student?.name} />
          <InfoRow label="ERP ID"      value={student?.erpId} />
          <InfoRow label="Email"       value={student?.email} />
          <InfoRow label="Phone"       value={student?.phone} />
          <InfoRow label="Department"  value={student?.department} />
          <InfoRow label="Year"        value={student?.year} />
          <InfoRow label="Section"     value={student?.section} />
        </View>

        {/* App Info */}
        <View style={[styles.card, shadow]}>
          <Text style={styles.cardTitle}>About SpotScout</Text>
          <InfoRow label="Version"  value="1.0.0" />
          <InfoRow label="Campus"   value="Graphic Era Hill University" />
          <InfoRow label="Libraries" value="5 campus libraries" />
        </View>

        {/* Danger zone */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>🗑️ Clear All Data & Reset</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.offWhite },
  header:         { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 32, alignItems: 'center', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  avatarCircle:   { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText:     { fontSize: 34, fontWeight: '800', color: colors.white },
  headerName:     { color: colors.white, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  headerErp:      { color: 'rgba(255,255,255,0.65)', fontSize: 14, marginBottom: 10 },
  headerBadge:    { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 6 },
  headerBadgeText:{ color: colors.white, fontSize: 13, fontWeight: '600' },
  body:           { padding: 20, gap: 16 },
  statsRow:       { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' },
  statBox:        { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statBorder:     { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  statNum:        { fontSize: 20, fontWeight: '800', color: colors.navy },
  statLbl:        { fontSize: 11, color: colors.textSub, marginTop: 2 },
  card:           { backgroundColor: colors.white, borderRadius: radius.lg, padding: 18 },
  cardTitle:      { fontSize: 14, fontWeight: '700', color: colors.textSub, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.grayLight },
  infoLabel:      { fontSize: 14, color: colors.textSub },
  infoValue:      { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  resetBtn:       { backgroundColor: colors.redBg, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  resetBtnText:   { color: colors.red, fontWeight: '700', fontSize: 15 },
});
