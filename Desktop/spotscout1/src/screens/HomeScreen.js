import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, shadow } from '../components/theme';
import { getLibraries, getStudent, bookSeat, getBookings, getSecondsLeft, formatCountdown } from '../data/storage';

const { width } = Dimensions.get('window');
const CARD_W = width * 0.72;

export default function HomeScreen({ navigation }) {
  const [student, setStudent]       = useState(null);
  const [libraries, setLibraries]   = useState([]);
  const [selected, setSelected]     = useState(null);
  const [bookModal, setBookModal]   = useState(false);
  const [bookingResult, setBookingResult] = useState(null); // null | { booking }
  const [countdown, setCountdown]   = useState(0);
  const [activeBooking, setActiveBooking] = useState(null); // pending booking if any
  const timerRef = useRef(null);

  useFocusEffect(useCallback(() => {
    load();
    return () => clearInterval(timerRef.current);
  }, []));

  const load = async () => {
    const [s, libs, bkgs] = await Promise.all([getStudent(), getLibraries(), getBookings()]);
    setStudent(s);
    setLibraries(libs);
    // Check if student has any pending booking (6 min countdown active)
    const pending = bkgs.find(b => b.status === 'pending' && b.studentErp === s?.erpId);
    setActiveBooking(pending || null);
    if (pending) startCountdown(pending.expiresAt);
  };

  const startCountdown = (expiresAt) => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const secs = getSecondsLeft(expiresAt);
      setCountdown(secs);
      if (secs <= 0) { clearInterval(timerRef.current); load(); }
    }, 1000);
    setCountdown(getSecondsLeft(expiresAt));
  };

  const openBook = (lib) => {
    setSelected(lib);
    setBookingResult(null);
    setBookModal(true);
  };

  const confirmBook = async () => {
    if (!selected || !student) return;
    const result = await bookSeat(selected, student);
    if (!result.success) {
      Alert.alert('Cannot Book', result.reason);
      return;
    }
    setBookingResult(result);
    setActiveBooking(result.booking);
    startCountdown(result.booking.expiresAt);
    await load();
  };

  const spotStatus = (lib) => {
    if (lib.availableSpots === 0)    return { label: 'Full',      bg: colors.redBg,    fg: colors.red,    dot: '🔴' };
    if (lib.availableSpots <= 3)     return { label: 'Limited',   bg: colors.orangeBg, fg: colors.orange, dot: '🟠' };
    return                                  { label: 'Available', bg: colors.greenBg,  fg: colors.green,  dot: '🟢' };
  };

  const firstName = student?.name?.split(' ')[0] || 'Student';
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <LinearGradient colors={[colors.navy, colors.navyLight]} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoRow}>
              <View style={styles.logoBadge}><Text style={{ fontSize: 18 }}>📍</Text></View>
              <Text style={styles.logoName}>SpotScout</Text>
            </View>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingText}>{greeting},</Text>
              <Text style={styles.greetingName}>{firstName} 👋</Text>
            </View>
            <View style={styles.erpBadge}>
              <Text style={styles.erpText}>{student?.erpId || 'ERP'}</Text>
            </View>
          </View>

          <View style={styles.statsStrip}>
            {[
              { label: 'Libraries',   value: libraries.length },
              { label: 'Open Now',    value: libraries.filter(l => l.availableSpots > 0).length },
              { label: 'Total Seats', value: libraries.reduce((s, l) => s + l.availableSpots, 0) },
            ].map((s, i) => (
              <View key={i} style={[styles.statItem, i < 2 && styles.statBorder]}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.body}>

          {/* ── Active Pending Booking Banner ── */}
          {activeBooking && countdown > 0 && (
            <TouchableOpacity
              style={styles.pendingBanner}
              onPress={() => navigation.navigate('Scanner')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#E65100', '#F57C00']} style={styles.pendingGrad}>
                <View style={styles.pendingLeft}>
                  <Text style={styles.pendingTitle}>⏳ Seat Reserved!</Text>
                  <Text style={styles.pendingLib}>{activeBooking.libraryName}</Text>
                  <Text style={styles.pendingInstr}>Scan QR at entrance now →</Text>
                </View>
                <View style={styles.pendingTimer}>
                  <Text style={styles.pendingTimerNum}>{formatCountdown(countdown)}</Text>
                  <Text style={styles.pendingTimerLabel}>remaining</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── Library Cards ── */}
          <Text style={styles.sectionTitle}>Nearby Libraries</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
            {libraries.map(lib => {
              const st = spotStatus(lib);
              return (
                <View key={lib.id} style={[styles.libCard, shadow]}>
                  <View style={styles.libCardTop}>
                    <View style={styles.libIconBox}><Text style={{ fontSize: 22 }}>🏛️</Text></View>
                    <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusPillText, { color: st.fg }]}>{st.dot} {st.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.libBuilding}>{lib.building}</Text>
                  <Text style={styles.libName}>{lib.name}</Text>
                  <Text style={styles.libSpots}>
                    <Text style={{ fontWeight: '700', color: st.fg }}>{lib.availableSpots}</Text>
                    <Text style={{ color: colors.textSub }}> / {lib.totalSpots} seats</Text>
                  </Text>
                  <TouchableOpacity
                    style={[styles.bookBtn, lib.availableSpots === 0 && styles.bookBtnDisabled]}
                    onPress={() => lib.availableSpots > 0 && openBook(lib)}
                    disabled={lib.availableSpots === 0}
                  >
                    <Text style={styles.bookBtnText}>
                      {lib.availableSpots === 0 ? 'Library Full' : 'Book Seat'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* ── QR Banner ── */}
          <TouchableOpacity onPress={() => navigation.navigate('Scanner')} activeOpacity={0.9}>
            <LinearGradient colors={[colors.blueVibrant, colors.navy]} style={styles.qrBanner}>
              <View>
                <Text style={styles.qrBannerTitle}>Scan to Check In / Out</Text>
                <Text style={styles.qrBannerSub}>Point camera at library entrance{'\n'}QR code to confirm your seat</Text>
              </View>
              <View style={styles.qrIconCircle}><Text style={{ fontSize: 28 }}>📷</Text></View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── All Libraries List ── */}
          <Text style={styles.sectionTitle}>All Libraries</Text>
          <View style={styles.allLibsCard}>
            {libraries.map((lib, index) => {
              const st = spotStatus(lib);
              return (
                <TouchableOpacity
                  key={lib.id}
                  style={[styles.allLibRow, index < libraries.length - 1 && styles.allLibBorder]}
                  onPress={() => lib.availableSpots > 0 && openBook(lib)}
                >
                  <View style={styles.allLibLeft}>
                    <Text style={styles.allLibEmoji}>🏛️</Text>
                    <View>
                      <Text style={styles.allLibName}>{lib.name}</Text>
                      <Text style={styles.allLibBuilding}>{lib.building}</Text>
                    </View>
                  </View>
                  <View style={styles.allLibRight}>
                    <Text style={[styles.allLibSpots, { color: st.fg }]}>{lib.availableSpots}/{lib.totalSpots}</Text>
                    <View style={[styles.allLibDot, { backgroundColor: st.fg }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

        </View>
      </ScrollView>

      {/* ── Booking Modal ── */}
      <Modal visible={bookModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

            {!bookingResult ? (
              /* ── Confirm booking ── */
              <>
                <Text style={styles.modalTitle}>{selected?.name}</Text>
                <Text style={styles.modalBuilding}>{selected?.building}</Text>

                <View style={styles.modalSpotsRow}>
                  <Text style={styles.modalSpotsNum}>{selected?.availableSpots}</Text>
                  <Text style={styles.modalSpotsLabel}> seats available</Text>
                </View>

                {/* 6 min warning */}
                <View style={styles.warningBox}>
                  <Text style={styles.warningTitle}>⏳ Important</Text>
                  <Text style={styles.warningText}>
                    After booking, you have <Text style={{ fontWeight: '800' }}>6 minutes</Text> to scan the QR code at the library entrance. If you don't scan in time, your seat will be released.
                  </Text>
                </View>

                <View style={styles.modalStudentCard}>
                  <Text style={styles.modalStudentName}>👤 {student?.name}</Text>
                  <Text style={styles.modalStudentInfo}>{student?.erpId} · {student?.department} · {student?.year}</Text>
                </View>

                <TouchableOpacity style={styles.confirmBtn} onPress={confirmBook}>
                  <Text style={styles.confirmBtnText}>✅ Book & Start Timer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setBookModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* ── Booked! Show countdown + go scan ── */
              <View style={styles.successBox}>
                <Text style={styles.successEmoji}>🎉</Text>
                <Text style={styles.successTitle}>Seat Reserved!</Text>
                <Text style={styles.successLib}>{bookingResult.booking.libraryName}</Text>

                <View style={styles.countdownBox}>
                  <Text style={styles.countdownLabel}>Scan QR at entrance within</Text>
                  <Text style={styles.countdownNum}>{formatCountdown(countdown)}</Text>
                  <Text style={styles.countdownSub}>or your seat will be released</Text>
                </View>

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: '#E65100' }]}
                  onPress={() => { setBookModal(false); navigation.navigate('Scanner'); }}
                >
                  <Text style={styles.confirmBtnText}>📷 Scan QR Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setBookModal(false)}>
                  <Text style={styles.cancelBtnText}>I'll scan later</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.offWhite },
  header:           { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  logoRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBadge:        { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  logoName:         { color: colors.white, fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  settingsBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  greetingRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 },
  greetingText:     { color: 'rgba(255,255,255,0.65)', fontSize: 14 },
  greetingName:     { color: colors.white, fontSize: 22, fontWeight: '800' },
  erpBadge:         { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  erpText:          { color: colors.white, fontSize: 12, fontWeight: '600' },
  statsStrip:       { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.lg, padding: 12 },
  statItem:         { flex: 1, alignItems: 'center' },
  statBorder:       { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
  statValue:        { color: colors.white, fontSize: 20, fontWeight: '800' },
  statLabel:        { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  body:             { padding: 20 },
  pendingBanner:    { marginBottom: 20, borderRadius: radius.lg, overflow: 'hidden' },
  pendingGrad:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  pendingLeft:      { flex: 1 },
  pendingTitle:     { color: 'white', fontSize: 14, fontWeight: '800', marginBottom: 2 },
  pendingLib:       { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 4 },
  pendingInstr:     { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  pendingTimer:     { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: radius.md, padding: 12 },
  pendingTimerNum:  { color: 'white', fontSize: 26, fontWeight: '800' },
  pendingTimerLabel:{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },
  sectionTitle:     { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 14, marginTop: 8 },
  cardsScroll:      { paddingRight: 20, gap: 14, paddingBottom: 4 },
  libCard:          { width: CARD_W, backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  libCardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  libIconBox:       { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  statusPill:       { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText:   { fontSize: 11, fontWeight: '700' },
  libBuilding:      { fontSize: 11, color: colors.textSub, marginBottom: 2 },
  libName:          { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  libSpots:         { fontSize: 13, marginBottom: 14 },
  bookBtn:          { backgroundColor: colors.navy, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center' },
  bookBtnDisabled:  { backgroundColor: colors.grayLight },
  bookBtnText:      { color: colors.white, fontWeight: '700', fontSize: 14 },
  qrBanner:         { borderRadius: radius.lg, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  qrBannerTitle:    { color: colors.white, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  qrBannerSub:      { color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 18 },
  qrIconCircle:     { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  allLibsCard:      { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', marginBottom: 30, ...shadow },
  allLibRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  allLibBorder:     { borderBottomWidth: 1, borderBottomColor: colors.grayLight },
  allLibLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  allLibEmoji:      { fontSize: 22 },
  allLibName:       { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  allLibBuilding:   { fontSize: 11, color: colors.textSub, marginTop: 2 },
  allLibRight:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  allLibSpots:      { fontSize: 13, fontWeight: '700' },
  allLibDot:        { width: 8, height: 8, borderRadius: 4 },
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:        { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.grayLight, alignSelf: 'center', marginBottom: 20 },
  modalTitle:       { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  modalBuilding:    { fontSize: 13, color: colors.textSub, marginBottom: 16 },
  modalSpotsRow:    { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  modalSpotsNum:    { fontSize: 42, fontWeight: '800', color: colors.navy },
  modalSpotsLabel:  { fontSize: 16, color: colors.textSub },
  warningBox:       { backgroundColor: '#FFF8E1', borderRadius: radius.md, padding: 14, borderLeftWidth: 4, borderLeftColor: colors.accent, marginBottom: 16 },
  warningTitle:     { fontSize: 13, fontWeight: '700', color: '#795548', marginBottom: 4 },
  warningText:      { fontSize: 13, color: '#5D4037', lineHeight: 19 },
  modalStudentCard: { backgroundColor: colors.offWhite, borderRadius: radius.md, padding: 14, marginBottom: 20 },
  modalStudentName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  modalStudentInfo: { fontSize: 12, color: colors.textSub },
  confirmBtn:       { backgroundColor: colors.navy, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  confirmBtnText:   { color: colors.white, fontWeight: '700', fontSize: 16 },
  cancelBtn:        { paddingVertical: 10, alignItems: 'center' },
  cancelBtnText:    { color: colors.textSub, fontSize: 14 },
  successBox:       { alignItems: 'center' },
  successEmoji:     { fontSize: 52, marginBottom: 10 },
  successTitle:     { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  successLib:       { fontSize: 15, color: colors.textSub, marginBottom: 16 },
  countdownBox:     { backgroundColor: '#FFF3E0', borderRadius: radius.lg, padding: 20, alignItems: 'center', marginBottom: 20, width: '100%' },
  countdownLabel:   { fontSize: 13, color: colors.orange, fontWeight: '600', marginBottom: 6 },
  countdownNum:     { fontSize: 52, fontWeight: '800', color: colors.orange },
  countdownSub:     { fontSize: 12, color: colors.orange, marginTop: 4 },
});
