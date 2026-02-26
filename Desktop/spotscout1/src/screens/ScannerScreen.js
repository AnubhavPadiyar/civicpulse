import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../components/theme';
import { getStudent, handleQRScan, getSecondsLeft, formatCountdown } from '../data/storage';

export default function ScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned]             = useState(false);
  const [result, setResult]               = useState(null);
  const [torchOn, setTorchOn]             = useState(false);
  const [countdown, setCountdown]         = useState(0);

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync().then(({ status }) =>
      setHasPermission(status === 'granted')
    );
  }, []);

  // Live countdown timer for check-in confirmation screen
  useEffect(() => {
    if (result?.action === 'checkin' && result.booking?.sessionEndsAt) {
      const interval = setInterval(() => {
        setCountdown(getSecondsLeft(result.booking.sessionEndsAt));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [result]);

  const handleScan = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(120);

    const student = await getStudent();
    const outcome = await handleQRScan(data, student);
    setResult({ ...outcome, student });

    if (outcome.action === 'checkin' && outcome.booking?.sessionEndsAt) {
      setCountdown(getSecondsLeft(outcome.booking.sessionEndsAt));
    }
  };

  const reset = () => { setResult(null); setScanned(false); };

  if (hasPermission === null) return (
    <View style={styles.center}>
      <Text style={styles.permText}>Requesting camera...</Text>
    </View>
  );

  if (hasPermission === false) return (
    <View style={styles.center}>
      <Text style={styles.permEmoji}>📷</Text>
      <Text style={styles.permTitle}>Camera Access Needed</Text>
      <Text style={styles.permText}>Allow camera in your phone settings to scan QR codes.</Text>
    </View>
  );

  // ── Result screens ──────────────────────────────────────
  if (result) {
    const { action, booking, student } = result;

    // ✅ CHECK IN SUCCESS
    if (action === 'checkin') {
      const sessionHrs = Math.floor(countdown / 3600);
      const sessionMin = Math.floor((countdown % 3600) / 60);
      return (
        <View style={styles.resultBg}>
          <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.resultHeader}>
            <Text style={styles.resultHeaderEmoji}>✅</Text>
            <Text style={styles.resultHeaderTitle}>Checked In!</Text>
            <Text style={styles.resultHeaderSub}>Your seat is confirmed</Text>
          </LinearGradient>
          <View style={styles.resultCard}>
            <View style={styles.handle} />
            <Text style={styles.resultLibName}>{booking.libraryName}</Text>
            <Text style={styles.resultBuilding}>{booking.building}</Text>

            <View style={styles.sessionBox}>
              <Text style={styles.sessionLabel}>Session ends in</Text>
              <Text style={styles.sessionTimer}>
                {sessionHrs}h {sessionMin}m
              </Text>
              <Text style={styles.sessionSub}>Scan QR again when you leave</Text>
            </View>

            <View style={styles.studentCard}>
              <Text style={styles.studentName}>👤 {booking.studentName}</Text>
              <Text style={styles.studentInfo}>
                {booking.studentErp} · {booking.department} · {booking.year} · Sec {booking.section}
              </Text>
            </View>

            <TouchableOpacity style={[styles.btn, { backgroundColor: '#2E7D32' }]} onPress={() => { reset(); navigation.navigate('MySpots'); }}>
              <Text style={styles.btnText}>View My Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGhost} onPress={reset}>
              <Text style={styles.btnGhostText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 🚪 CHECK OUT SUCCESS
    if (action === 'checkout') {
      return (
        <View style={styles.resultBg}>
          <LinearGradient colors={[colors.navy, colors.navyLight]} style={styles.resultHeader}>
            <Text style={styles.resultHeaderEmoji}>🚪</Text>
            <Text style={styles.resultHeaderTitle}>Checked Out!</Text>
            <Text style={styles.resultHeaderSub}>Seat released successfully</Text>
          </LinearGradient>
          <View style={styles.resultCard}>
            <View style={styles.handle} />
            <Text style={styles.resultLibName}>{booking.libraryName}</Text>
            <Text style={styles.resultBuilding}>{booking.building}</Text>

            <View style={[styles.sessionBox, { backgroundColor: colors.blueSoft }]}>
              <Text style={styles.sessionLabel}>Thank you for checking out!</Text>
              <Text style={[styles.sessionTimer, { fontSize: 36, color: colors.navy }]}>👋</Text>
              <Text style={styles.sessionSub}>Your seat is now available for others</Text>
            </View>

            <View style={styles.studentCard}>
              <Text style={styles.studentName}>👤 {booking.studentName}</Text>
              <Text style={styles.studentInfo}>{booking.studentErp} · {booking.department}</Text>
            </View>

            <TouchableOpacity style={styles.btn} onPress={reset}>
              <Text style={styles.btnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // ⏰ EXPIRED — 6 min window passed
    if (action === 'expired') {
      return (
        <View style={styles.resultBg}>
          <LinearGradient colors={['#B71C1C', '#C62828']} style={styles.resultHeader}>
            <Text style={styles.resultHeaderEmoji}>⏰</Text>
            <Text style={styles.resultHeaderTitle}>Reservation Expired</Text>
            <Text style={styles.resultHeaderSub}>6 minute window passed</Text>
          </LinearGradient>
          <View style={styles.resultCard}>
            <View style={styles.handle} />
            <Text style={styles.resultLibName}>{booking?.libraryName}</Text>
            <View style={[styles.sessionBox, { backgroundColor: colors.redBg }]}>
              <Text style={[styles.sessionLabel, { color: colors.red }]}>Your seat was auto-released</Text>
              <Text style={[styles.sessionSub, { color: colors.red }]}>
                You must book again and scan within 6 minutes of booking
              </Text>
            </View>
            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.red }]} onPress={() => { reset(); navigation.navigate('Home'); }}>
              <Text style={styles.btnText}>Book Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGhost} onPress={reset}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // ❌ NO BOOKING FOUND
    if (action === 'none') {
      return (
        <View style={styles.resultBg}>
          <LinearGradient colors={['#E65100', '#F57C00']} style={styles.resultHeader}>
            <Text style={styles.resultHeaderEmoji}>⚠️</Text>
            <Text style={styles.resultHeaderTitle}>No Active Booking</Text>
            <Text style={styles.resultHeaderSub}>Book a seat in the app first</Text>
          </LinearGradient>
          <View style={styles.resultCard}>
            <View style={styles.handle} />
            <View style={[styles.sessionBox, { backgroundColor: colors.orangeBg }]}>
              <Text style={[styles.sessionLabel, { color: colors.orange }]}>How to check in:</Text>
              <Text style={[styles.sessionSub, { color: colors.orange, textAlign: 'left', marginTop: 8 }]}>
                1. Go to Home screen{'\n'}
                2. Tap "Book Seat" on any library card{'\n'}
                3. Come back and scan QR within 6 minutes
              </Text>
            </View>
            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.orange }]} onPress={() => { reset(); navigation.navigate('Home'); }}>
              <Text style={styles.btnText}>Go to Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGhost} onPress={reset}>
              <Text style={styles.btnGhostText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }

  // ── Camera View ─────────────────────────────────────────
  return (
    <View style={styles.scanContainer}>
      <BarCodeScanner
        style={StyleSheet.absoluteFillObject}
        onBarCodeScanned={handleScan}
        torchMode={torchOn ? 'on' : 'off'}
      />

      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanBox}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            <View style={styles.scanLine} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          <Text style={styles.scanHint}>Point at library entrance QR code</Text>
          <Text style={styles.scanHintSub}>Scan to check in OR check out</Text>
          <TouchableOpacity style={styles.torchBtn} onPress={() => setTorchOn(t => !t)}>
            <Text style={styles.torchIcon}>{torchOn ? '🔦 On' : '🔦 Off'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Scan QR Code</Text>
        <View style={{ width: 36 }} />
      </View>
    </View>
  );
}

const BOX = 240;
const styles = StyleSheet.create({
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: colors.navy },
  permEmoji:        { fontSize: 52, marginBottom: 16 },
  permTitle:        { fontSize: 20, fontWeight: '700', color: colors.white, marginBottom: 8 },
  permText:         { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  scanContainer:    { flex: 1, backgroundColor: 'black' },
  topBar:           { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backText:         { color: 'white', fontSize: 18, fontWeight: '700' },
  topBarTitle:      { color: 'white', fontSize: 17, fontWeight: '700' },
  overlay:          { flex: 1 },
  overlayTop:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  overlayMiddle:    { flexDirection: 'row', height: BOX },
  overlaySide:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  scanBox:          { width: BOX, height: BOX },
  overlayBottom:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', gap: 8 },
  corner:           { position: 'absolute', width: 26, height: 26, borderColor: 'white', borderWidth: 3 },
  tl:               { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr:               { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl:               { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br:               { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine:         { position: 'absolute', top: '50%', left: 10, right: 10, height: 2, backgroundColor: '#42A5F5', opacity: 0.9 },
  scanHint:         { color: 'white', fontSize: 15, fontWeight: '600' },
  scanHintSub:      { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  torchBtn:         { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full },
  torchIcon:        { color: 'white', fontSize: 14, fontWeight: '600' },
  resultBg:         { flex: 1, backgroundColor: colors.offWhite },
  resultHeader:     { paddingTop: 70, paddingBottom: 30, alignItems: 'center' },
  resultHeaderEmoji:{ fontSize: 48, marginBottom: 8 },
  resultHeaderTitle:{ color: 'white', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  resultHeaderSub:  { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  resultCard:       { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, marginTop: -16 },
  handle:           { width: 40, height: 4, backgroundColor: colors.grayLight, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  resultLibName:    { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  resultBuilding:   { fontSize: 13, color: colors.textSub, marginBottom: 16 },
  sessionBox:       { backgroundColor: colors.greenBg, borderRadius: radius.lg, padding: 18, marginBottom: 16, alignItems: 'center' },
  sessionLabel:     { fontSize: 13, color: colors.green, fontWeight: '600', marginBottom: 6 },
  sessionTimer:     { fontSize: 44, fontWeight: '800', color: colors.green, marginBottom: 4 },
  sessionSub:       { fontSize: 12, color: colors.green, textAlign: 'center' },
  studentCard:      { backgroundColor: colors.offWhite, borderRadius: radius.md, padding: 14, marginBottom: 20 },
  studentName:      { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  studentInfo:      { fontSize: 12, color: colors.textSub },
  btn:              { backgroundColor: colors.navy, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  btnText:          { color: colors.white, fontWeight: '700', fontSize: 16 },
  btnGhost:         { paddingVertical: 10, alignItems: 'center' },
  btnGhostText:     { color: colors.textSub, fontSize: 14 },
});
