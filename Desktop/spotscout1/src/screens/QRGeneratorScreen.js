import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Share, Alert, Dimensions
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../components/theme';
import { LIBRARIES } from '../data/storage';

const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.55;

export default function QRGeneratorScreen({ adminLibId }) {
  // If adminLibId is set, show only that library. If null = master admin = show all
  const visible = adminLibId
    ? LIBRARIES.filter(l => l.id === adminLibId)
    : LIBRARIES;

  const [selected, setSelected] = useState(visible[0]);
  const svgRef = useRef(null);

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `📍 SpotScout — ${selected.name}\n` +
          `${selected.building}\n\n` +
          `QR Code ID: ${selected.id}\n\n` +
          `Students scan this code at the library entrance using the SpotScout app to book a seat.`,
        title: `SpotScout QR — ${selected.name}`,
      });
    } catch (e) {
      Alert.alert('Share failed', e.message);
    }
  };

  const spotColor = (lib) => {
    if (lib.availableSpots === 0) return colors.red;
    if (lib.availableSpots <= 3)  return colors.orange;
    return colors.green;
  };

  const spotLabel = (lib) => {
    if (lib.availableSpots === 0) return '🔴 Full';
    if (lib.availableSpots <= 3)  return '🟠 Limited';
    return '🟢 Available';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.navy, colors.navyLight]} style={styles.header}>
        <Text style={styles.headerTitle}>Library QR Codes</Text>
        <Text style={styles.headerSub}>Students scan these at the entrance</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Library selector tabs (master admin sees all) */}
        {visible.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            {visible.map(lib => (
              <TouchableOpacity
                key={lib.id}
                style={[styles.tab, selected?.id === lib.id && styles.tabActive]}
                onPress={() => setSelected(lib)}
              >
                <Text style={[styles.tabText, selected?.id === lib.id && styles.tabTextActive]}>
                  {lib.name.replace(' Library', '')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Main QR Card */}
        {selected && (
          <View style={[styles.qrCard, shadow]}>

            {/* Card Header */}
            <LinearGradient colors={[colors.navy, '#1a3a6b']} style={styles.qrCardHeader}>
              <View style={styles.qrCardHeaderInner}>
                <View style={styles.spotscoutBadge}>
                  <Text style={styles.spotscoutBadgeText}>📍 SpotScout</Text>
                </View>
                <Text style={styles.qrCardTitle}>{selected.name}</Text>
                <Text style={styles.qrCardBuilding}>{selected.building}</Text>
              </View>
            </LinearGradient>

            {/* QR Code */}
            <View style={styles.qrWrapper}>
              <View style={styles.qrBg}>
                {/* Corner decorations */}
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />

                <QRCode
                  value={selected.id}
                  size={QR_SIZE}
                  color={colors.navy}
                  backgroundColor="transparent"
                  getRef={ref => (svgRef.current = ref)}
                  logo={undefined}
                  quietZone={10}
                />
              </View>

              <Text style={styles.scanPrompt}>📷  Scan with SpotScout app</Text>
              <View style={styles.idChip}>
                <Text style={styles.idChipText}>ID: {selected.id}</Text>
              </View>
            </View>

            {/* Live Status */}
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Text style={styles.statusNum}>{selected.availableSpots}</Text>
                <Text style={styles.statusLbl}>Available</Text>
              </View>
              <View style={[styles.statusItem, styles.statusBorder]}>
                <Text style={styles.statusNum}>{selected.totalSpots}</Text>
                <Text style={styles.statusLbl}>Total Seats</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={[styles.statusBadgeText, { color: spotColor(selected) }]}>
                  {spotLabel(selected)}
                </Text>
                <Text style={styles.statusLbl}>Status</Text>
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>📌 How to use</Text>
              <Text style={styles.instructionStep}>1. Print this QR code and place it at the library entrance</Text>
              <Text style={styles.instructionStep}>2. Students open SpotScout → tap the 📷 Scanner tab</Text>
              <Text style={styles.instructionStep}>3. They point camera at this QR to book a seat instantly</Text>
            </View>

            {/* Share Button */}
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>📤  Share / Save QR Info</Text>
            </TouchableOpacity>

          </View>
        )}

        {/* All libraries quick view (master admin) */}
        {visible.length > 1 && (
          <View style={styles.allSection}>
            <Text style={styles.allTitle}>All Library QR Codes</Text>
            {visible.map(lib => (
              <TouchableOpacity
                key={lib.id}
                style={[styles.allRow, shadow]}
                onPress={() => setSelected(lib)}
              >
                <View style={styles.miniQr}>
                  <QRCode value={lib.id} size={52} color={colors.navy} backgroundColor="white" />
                </View>
                <View style={styles.allRowBody}>
                  <Text style={styles.allRowName}>{lib.name}</Text>
                  <Text style={styles.allRowBuilding}>{lib.building}</Text>
                  <Text style={[styles.allRowStatus, { color: spotColor(lib) }]}>
                    {lib.availableSpots}/{lib.totalSpots} seats · {spotLabel(lib)}
                  </Text>
                </View>
                <Text style={styles.allRowArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Print tip */}
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>💡 Printing Tip</Text>
          <Text style={styles.tipText}>
            Take a screenshot of the QR code above and print it at A5 size or larger. 
            Laminate it for durability and place it at the library entrance door or desk.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.offWhite },
  header:             { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle:        { color: colors.white, fontSize: 20, fontWeight: '800' },
  headerSub:          { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 3 },
  scroll:             { padding: 16, paddingBottom: 40 },
  tabsScroll:         { gap: 8, paddingBottom: 14, paddingHorizontal: 2 },
  tab:                { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  tabActive:          { backgroundColor: colors.navy, borderColor: colors.navy },
  tabText:            { fontSize: 13, color: colors.textSub, fontWeight: '600' },
  tabTextActive:      { color: colors.white },
  qrCard:             { backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden', marginBottom: 20 },
  qrCardHeader:       { paddingVertical: 20, paddingHorizontal: 20 },
  qrCardHeaderInner:  { alignItems: 'center' },
  spotscoutBadge:     { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 10 },
  spotscoutBadgeText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  qrCardTitle:        { color: colors.white, fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  qrCardBuilding:     { color: 'rgba(255,255,255,0.65)', fontSize: 13, textAlign: 'center' },
  qrWrapper:          { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  qrBg:               { backgroundColor: colors.white, padding: 16, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.grayLight, position: 'relative', marginBottom: 16 },
  corner:             { position: 'absolute', width: 20, height: 20, borderColor: colors.navy, borderWidth: 3 },
  tl:                 { top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  tr:                 { top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bl:                 { bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  br:                 { bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  scanPrompt:         { fontSize: 14, color: colors.textSub, fontWeight: '600', marginBottom: 10 },
  idChip:             { backgroundColor: colors.blueSoft, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 5 },
  idChipText:         { fontSize: 12, color: colors.blue, fontWeight: '700', letterSpacing: 0.5 },
  statusRow:          { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.grayLight },
  statusItem:         { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statusBorder:       { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.grayLight },
  statusNum:          { fontSize: 22, fontWeight: '800', color: colors.navy },
  statusLbl:          { fontSize: 11, color: colors.textSub, marginTop: 2 },
  statusBadgeText:    { fontSize: 14, fontWeight: '800' },
  instructions:       { margin: 16, backgroundColor: colors.offWhite, borderRadius: radius.md, padding: 14 },
  instructionsTitle:  { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  instructionStep:    { fontSize: 13, color: colors.textSub, marginBottom: 6, lineHeight: 19 },
  shareBtn:           { margin: 16, marginTop: 4, backgroundColor: colors.navy, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  shareBtnText:       { color: colors.white, fontWeight: '700', fontSize: 15 },
  allSection:         { marginBottom: 20 },
  allTitle:           { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  allRow:             { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, marginBottom: 10, gap: 14 },
  miniQr:             { padding: 6, backgroundColor: colors.white, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  allRowBody:         { flex: 1 },
  allRowName:         { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  allRowBuilding:     { fontSize: 12, color: colors.textSub, marginTop: 2 },
  allRowStatus:       { fontSize: 12, fontWeight: '600', marginTop: 4 },
  allRowArrow:        { fontSize: 22, color: colors.gray },
  tipBox:             { backgroundColor: '#FFF8E1', borderRadius: radius.md, padding: 16, borderLeftWidth: 4, borderLeftColor: colors.accent },
  tipTitle:           { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  tipText:            { fontSize: 13, color: colors.textSub, lineHeight: 20 },
});
