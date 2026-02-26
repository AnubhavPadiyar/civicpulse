import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Modal, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../components/theme';
import { getStudent, bookSeat, getLibraries } from '../data/storage';

export default function FullMapScreen({ route, navigation }) {
  const [libraries, setLibraries] = useState(route.params?.libraries || []);
  const [selected, setSelected]   = useState(null);
  const [modal, setModal]         = useState(false);
  const [booked, setBooked]       = useState(false);

  const spotStatus = (lib) => {
    if (lib.availableSpots === 0)  return { label: 'Full',      bg: colors.redBg,    fg: colors.red };
    if (lib.availableSpots <= 3)   return { label: 'Limited',   bg: colors.orangeBg, fg: colors.orange };
    return                                { label: 'Available', bg: colors.greenBg,  fg: colors.green };
  };

  const handleBook = async () => {
    const student = await getStudent();
    const result  = await bookSeat(selected, student);
    if (!result.success) { Alert.alert('Cannot Book', result.reason); return; }
    const libs = await getLibraries();
    setLibraries(libs);
    setBooked(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.navy, colors.navyLight]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Libraries</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <FlatList
        data={libraries}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const st = spotStatus(item);
          return (
            <TouchableOpacity
              style={[styles.card, shadow]}
              onPress={() => { setSelected(item); setBooked(false); setModal(true); }}
            >
              <View style={styles.cardLeft}>
                <View style={styles.iconBox}><Text style={{ fontSize: 24 }}>🏛️</Text></View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.libName}>{item.name}</Text>
                <Text style={styles.libBuilding}>{item.building}</Text>
                <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                  <Text style={[styles.statusText, { color: st.fg }]}>{st.label}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.spotsNum, { color: st.fg }]}>{item.availableSpots}</Text>
                <Text style={styles.spotsLabel}>seats</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            {!booked ? (
              <>
                <Text style={styles.sheetTitle}>{selected?.name}</Text>
                <Text style={styles.sheetSub}>{selected?.building}</Text>
                <View style={styles.sheetSpots}>
                  <Text style={{ fontSize: 48, fontWeight: '800', color: selected?.availableSpots === 0 ? colors.red : colors.green }}>
                    {selected?.availableSpots}
                  </Text>
                  <Text style={{ color: colors.textSub, fontSize: 16 }}> / {selected?.totalSpots} seats available</Text>
                </View>
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>⏳ You have <Text style={{ fontWeight: '800' }}>6 minutes</Text> to scan QR at entrance after booking!</Text>
                </View>
                <TouchableOpacity
                  style={[styles.bookBtn, selected?.availableSpots === 0 && { backgroundColor: colors.grayLight }]}
                  onPress={() => selected?.availableSpots > 0 && handleBook()}
                  disabled={selected?.availableSpots === 0}
                >
                  <Text style={styles.bookBtnText}>{selected?.availableSpots === 0 ? 'Library Full' : '✅ Book This Seat'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                  <Text style={styles.cancelText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 52, marginBottom: 10 }}>🎉</Text>
                <Text style={styles.sheetTitle}>Seat Reserved!</Text>
                <Text style={styles.sheetSub}>{selected?.name}</Text>
                <Text style={{ color: colors.orange, fontWeight: '700', marginVertical: 16, textAlign: 'center' }}>
                  Scan QR at entrance within 6 minutes!
                </Text>
                <TouchableOpacity style={styles.bookBtn} onPress={() => { setModal(false); navigation.navigate('Scanner'); }}>
                  <Text style={styles.bookBtnText}>📷 Scan QR Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                  <Text style={styles.cancelText}>Later</Text>
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
  container:   { flex: 1, backgroundColor: colors.offWhite },
  header:      { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backText:    { color: 'white', fontSize: 18, fontWeight: '700' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  list:        { padding: 20, gap: 12 },
  card:        { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardLeft:    {},
  iconBox:     { width: 50, height: 50, borderRadius: 14, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  cardBody:    { flex: 1 },
  libName:     { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  libBuilding: { fontSize: 12, color: colors.textSub, marginBottom: 8 },
  statusPill:  { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText:  { fontSize: 11, fontWeight: '700' },
  cardRight:   { alignItems: 'center' },
  spotsNum:    { fontSize: 28, fontWeight: '800' },
  spotsLabel:  { fontSize: 11, color: colors.textSub },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle:      { width: 40, height: 4, backgroundColor: colors.grayLight, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle:  { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  sheetSub:    { fontSize: 13, color: colors.textSub, marginBottom: 16 },
  sheetSpots:  { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  warningBox:  { backgroundColor: '#FFF8E1', borderRadius: radius.md, padding: 14, borderLeftWidth: 4, borderLeftColor: colors.accent, marginBottom: 20 },
  warningText: { fontSize: 13, color: '#5D4037', lineHeight: 19 },
  bookBtn:     { backgroundColor: colors.navy, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  bookBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  cancelBtn:   { paddingVertical: 10, alignItems: 'center' },
  cancelText:  { color: colors.textSub },
});
