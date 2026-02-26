import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, shadow } from '../components/theme';
import { getBookings, getStudent } from '../data/storage';

export default function MySpotsScreen() {
  const [bookings, setBookings] = useState([]);
  const [student, setStudent]   = useState(null);

  useFocusEffect(useCallback(() => {
    getBookings().then(setBookings);
    getStudent().then(setStudent);
  }, []));

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.navy, colors.navyLight]} style={styles.header}>
        <Text style={styles.headerTitle}>My Spots</Text>
        <Text style={styles.headerSub}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''} made</Text>
      </LinearGradient>

      {bookings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏛️</Text>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptySub}>Scan a library QR code or tap{'\n'}"Book Seat" on the home screen</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View style={[styles.card, shadow]}>
              <View style={styles.cardLeft}>
                <View style={styles.indexBadge}>
                  <Text style={styles.indexText}>#{index + 1}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.libName}>{item.libraryName}</Text>
                <Text style={styles.building}>{item.building}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>🕐 {formatDate(item.bookedAt)}</Text>
                </View>
                <View style={styles.erpRow}>
                  <Text style={styles.erpText}>ERP: {item.erpId}</Text>
                </View>
              </View>
              <View style={styles.statusDot} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.offWhite },
  header:      { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: colors.white, fontSize: 26, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },
  list:        { padding: 20, gap: 12 },
  card:        { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  cardLeft:    { alignItems: 'center' },
  indexBadge:  { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  indexText:   { fontSize: 12, fontWeight: '700', color: colors.blue },
  cardBody:    { flex: 1 },
  libName:     { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  building:    { fontSize: 12, color: colors.textSub, marginBottom: 8 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  metaText:    { fontSize: 12, color: colors.textSub },
  erpRow:      { backgroundColor: colors.blueSoft, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  erpText:     { fontSize: 11, color: colors.blue, fontWeight: '600' },
  statusDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green, marginTop: 4 },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji:  { fontSize: 60, marginBottom: 16 },
  emptyTitle:  { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  emptySub:    { fontSize: 14, color: colors.textSub, textAlign: 'center', lineHeight: 22 },
});
