import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Alert, Modal, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, shadow } from '../components/theme';
import { getLibraries, saveLibraries, getBookings, adminReleaseSeats } from '../data/storage';
import QRGeneratorScreen from './QRGeneratorScreen';

// Each library has its own admin PIN defined in storage.js
// Central: 1111, Law: 2222, Santoshanad: 3333, CSIT: 4444, Chanakya: 5555
// Master admin PIN is 1234 (sees all libraries)
const MASTER_PIN = '1234';

export default function AdminScreen() {
  const [pin, setPin]           = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminLib, setAdminLib] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError]       = useState('');
  const [showQR, setShowQR]     = useState(false);

  useFocusEffect(useCallback(() => {
    if (loggedIn) {
      getLibraries().then(setLibraries);
      getBookings().then(setBookings);
    }
  }, [loggedIn]));

  const handleLogin = async () => {
    const libs = await getLibraries();
    if (pin === MASTER_PIN) {
      setLibraries(libs);
      setAdminLib(null);
      setLoggedIn(true);
      setError('');
      return;
    }
    const matched = libs.find(l => l.adminPin === pin);
    if (matched) {
      setLibraries(libs);
      setAdminLib(matched.id);
      setLoggedIn(true);
      setError('');
    } else {
      setError('Incorrect PIN. Try again.');
      setPin('');
    }
  };

  const updateSpots = async (libId, delta) => {
    const libs = await getLibraries();
    const updated = libs.map(l => {
      if (l.id !== libId) return l;
      const newVal = Math.max(0, Math.min(l.totalSpots, l.availableSpots + delta));
      return { ...l, availableSpots: newVal };
    });
    await saveLibraries(updated);
    setLibraries(updated);
  };

  const visibleLibs = adminLib
    ? libraries.filter(l => l.id === adminLib)
    : libraries;

  const spotColor = (lib) => {
    if (lib.availableSpots === 0)           return colors.red;
    if (lib.availableSpots <= 3)            return colors.orange;
    return colors.green;
  };

  if (!loggedIn) {
    return (
      <View style={styles.loginBg}>
        <LinearGradient colors={[colors.navy, colors.navyLight]} style={styles.loginGrad}>
          <View style={styles.lockIcon}><Text style={{ fontSize: 36 }}>🔐</Text></View>
          <Text style={styles.loginTitle}>Admin Access</Text>
          <Text style={styles.loginSub}>
            Enter your library admin PIN{'\n'}or master PIN to continue
          </Text>
        </LinearGradient>
        <View style={styles.loginCard}>
          <Text style={styles.pinLabel}>Admin PIN</Text>
          <View style={styles.pinRow}>
            {[0,1,2,3].map(i => (
              <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
            ))}
          </View>
          {/* Numpad */}
          <View style={styles.numpad}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.numKey, !key && styles.numKeyEmpty]}
                onPress={() => {
                  if (!key) return;
                  if (key === '⌫') { setPin(p => p.slice(0,-1)); setError(''); }
                  else if (pin.length < 4) setPin(p => p + key);
                }}
                disabled={!key}
              >
                <Text style={styles.numKeyText}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <TouchableOpacity
            style={[styles.loginBtn, pin.length < 4 && { opacity: 0.5 }]}
            onPress={handleLogin}
            disabled={pin.length < 4}
          >
            <Text style={styles.loginBtnText}>Unlock</Text>
          </TouchableOpacity>

          <Text style={styles.pinHint}>Library PINs: Central 1111 · Law 2222 · Santoshanad 3333{'\n'}CSIT 4444 · Chanakya 5555 · Master 1234</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.navy, colors.navyLight]} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>
              {adminLib ? '🏛️ Library Admin' : '⚙️ Master Admin'}
            </Text>
            <Text style={styles.headerSub}>
              {adminLib ? visibleLibs[0]?.name : `Managing all ${libraries.length} libraries`}
            </Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.qrBtn} onPress={() => setShowQR(true)}>
              <Text style={styles.qrBtnText}>📷 QR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => { setLoggedIn(false); setPin(''); setAdminLib(null); }}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* QR Generator Modal */}
      <Modal visible={showQR} animationType="slide" onRequestClose={() => setShowQR(false)}>
        <View style={{ flex: 1 }}>
          <View style={styles.qrModalTopBar}>
            <TouchableOpacity onPress={() => setShowQR(false)} style={styles.qrModalClose}>
              <Text style={styles.qrModalCloseText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <QRGeneratorScreen adminLibId={adminLib} />
        </View>
      </Modal>

      <FlatList
        data={visibleLibs}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, shadow]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardLib}>{item.name}</Text>
                <Text style={styles.cardBuilding}>{item.building}</Text>
              </View>
              <View style={[styles.statusBadge, {
                backgroundColor: item.availableSpots === 0 ? colors.redBg : item.availableSpots <= 3 ? colors.orangeBg : colors.greenBg
              }]}>
                <Text style={[styles.statusBadgeText, { color: spotColor(item) }]}>
                  {item.availableSpots === 0 ? 'Full' : item.availableSpots <= 3 ? 'Limited' : 'Open'}
                </Text>
              </View>
            </View>

            <View style={styles.spotsDisplay}>
              <Text style={[styles.spotsNum, { color: spotColor(item) }]}>{item.availableSpots}</Text>
              <Text style={styles.spotsOf}>/ {item.totalSpots} seats available</Text>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.ctrlBtn, styles.ctrlMinus, item.availableSpots === 0 && { opacity: 0.3 }]}
                onPress={() => updateSpots(item.id, -1)}
                disabled={item.availableSpots === 0}
              >
                <Text style={styles.ctrlBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.ctrlBar}>
                <View style={[styles.ctrlFill, {
                  width: `${(item.availableSpots / item.totalSpots) * 100}%`,
                  backgroundColor: spotColor(item)
                }]} />
              </View>
              <TouchableOpacity
                style={[styles.ctrlBtn, styles.ctrlPlus, item.availableSpots >= item.totalSpots && { opacity: 0.3 }]}
                onPress={() => updateSpots(item.id, 1)}
                disabled={item.availableSpots >= item.totalSpots}
              >
                <Text style={styles.ctrlBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                const confirmed = bookings.filter(b => b.libraryId === item.id && b.status === 'confirmed');
                if (confirmed.length === 0) return Alert.alert('No active sessions', 'No students are currently checked in.');
                Alert.alert(
                  'Release Seats',
                  `${confirmed.length} student(s) currently checked in at ${item.name}.\nHow many seats to release?`,
                  [
                    { text: 'Cancel' },
                    { text: 'Release 1', onPress: async () => { await adminReleaseSeats(item.id, 1); getLibraries().then(setLibraries); getBookings().then(setBookings); }},
                    { text: `Release All (${confirmed.length})`, onPress: async () => { await adminReleaseSeats(item.id, confirmed.length); getLibraries().then(setLibraries); getBookings().then(setBookings); }},
                  ]
                );
              }}
            >
              <Text style={styles.resetBtnText}>
                🚪 Release Seats ({bookings.filter(b => b.libraryId === item.id && b.status === 'confirmed').length} checked in)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resetBtn, { marginTop: 8, borderColor: colors.grayLight }]}
              onPress={() => Alert.alert('Reset Seats', `Reset ${item.name} to full capacity (${item.totalSpots})?`, [
                { text: 'Cancel' },
                { text: 'Reset', style: 'destructive', onPress: async () => {
                  const libs = await getLibraries();
                  const u = libs.map(l => l.id === item.id ? { ...l, availableSpots: l.totalSpots } : l);
                  await saveLibraries(u);
                  setLibraries(u);
                }}
              ])}
            >
              <Text style={styles.resetBtnText}>↺ Reset to Full Capacity</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loginBg:      { flex: 1, backgroundColor: colors.offWhite },
  loginGrad:    { paddingTop: 80, paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },
  lockIcon:     { width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  loginTitle:   { color: colors.white, fontSize: 26, fontWeight: '800', marginBottom: 6 },
  loginSub:     { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  loginCard:    { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, marginTop: -20, alignItems: 'center' },
  pinLabel:     { fontSize: 13, fontWeight: '600', color: colors.textSub, marginBottom: 16, marginTop: 8, letterSpacing: 1 },
  pinRow:       { flexDirection: 'row', gap: 16, marginBottom: 28 },
  pinDot:       { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.grayLight, borderWidth: 2, borderColor: colors.border },
  pinDotFilled: { backgroundColor: colors.navy, borderColor: colors.navy },
  numpad:       { flexDirection: 'row', flexWrap: 'wrap', width: 240, gap: 12, justifyContent: 'center', marginBottom: 16 },
  numKey:       { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.offWhite, alignItems: 'center', justifyContent: 'center' },
  numKeyEmpty:  { backgroundColor: 'transparent' },
  numKeyText:   { fontSize: 22, fontWeight: '600', color: colors.textPrimary },
  errorText:    { color: colors.red, fontSize: 13, marginBottom: 12 },
  loginBtn:     { backgroundColor: colors.navy, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 48, marginTop: 4 },
  loginBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  pinHint:      { marginTop: 20, fontSize: 11, color: colors.gray, textAlign: 'center', lineHeight: 18 },
  container:    { flex: 1, backgroundColor: colors.offWhite },
  header:       { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle:    { color: colors.white, fontSize: 22, fontWeight: '800' },
  headerSub:      { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 },
  headerBtns:     { flexDirection: 'row', gap: 8, alignItems: 'center' },
  qrBtn:          { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 7 },
  qrBtnText:      { color: colors.white, fontSize: 13, fontWeight: '700' },
  logoutBtn:      { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 7 },
  logoutText:     { color: colors.white, fontSize: 13, fontWeight: '600' },
  qrModalTopBar:  { backgroundColor: colors.navy, paddingTop: 52, paddingHorizontal: 20, paddingBottom: 14 },
  qrModalCloseText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  list:         { padding: 20, gap: 16 },
  card:         { backgroundColor: colors.white, borderRadius: radius.lg, padding: 18 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardLib:      { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  cardBuilding: { fontSize: 12, color: colors.textSub, marginTop: 2 },
  statusBadge:  { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  spotsDisplay: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  spotsNum:     { fontSize: 44, fontWeight: '800', marginRight: 8 },
  spotsOf:      { fontSize: 14, color: colors.textSub },
  controls:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  ctrlBtn:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  ctrlMinus:    { backgroundColor: colors.redBg },
  ctrlPlus:     { backgroundColor: colors.greenBg },
  ctrlBtnText:  { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  ctrlBar:      { flex: 1, height: 8, backgroundColor: colors.grayLight, borderRadius: 4, overflow: 'hidden' },
  ctrlFill:     { height: '100%', borderRadius: 4 },
  resetBtn:     { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  resetBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSub },
});
