import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../components/theme';
import { saveStudent } from '../data/storage';

const DEPARTMENTS = ['CSE','IT','ECE','ME','CE','MBA','LAW','PHARMA','BBA','OTHER'];
const YEARS = ['1st Year','2nd Year','3rd Year','4th Year'];
const SECTIONS = ['A','B','C','D','E'];

export default function OnboardingScreen({ onDone }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', erpId: '', email: '', phone: '',
    department: '', section: '', year: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validateStep1 = () => {
    if (!form.name.trim()) return Alert.alert('Required', 'Please enter your name');
    if (!form.erpId.trim()) return Alert.alert('Required', 'Please enter your ERP ID');
    if (!form.email.trim()) return Alert.alert('Required', 'Please enter your email');
    setStep(2);
  };

  const validateStep2 = () => {
    if (!form.department) return Alert.alert('Required', 'Please select department');
    if (!form.year) return Alert.alert('Required', 'Please select year');
    if (!form.section) return Alert.alert('Required', 'Please select section');
    handleSubmit();
  };

  const handleSubmit = async () => {
    await saveStudent({ ...form, joinedAt: new Date().toISOString() });
    onDone();
  };

  const Chip = ({ label, selected, onPress }) => (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={[colors.navy, colors.navyLight, '#1a3a6b']} style={styles.bg}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo area */}
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>📍</Text>
            </View>
            <Text style={styles.appName}>SpotScout</Text>
            <Text style={styles.tagline}>Your campus library companion</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Progress */}
            <View style={styles.progressRow}>
              <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
              <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
              <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
            </View>

            <Text style={styles.cardTitle}>
              {step === 1 ? '👋 Create your profile' : '🎓 Academic details'}
            </Text>
            <Text style={styles.cardSub}>
              {step === 1 ? 'We need a few details to get started' : 'Help us personalise your experience'}
            </Text>

            {step === 1 ? (
              <>
                <InputField label="Full Name" placeholder="e.g. Anubhav Sharma" value={form.name} onChangeText={v => set('name', v)} />
                <InputField label="ERP ID" placeholder="e.g. 2200123456" value={form.erpId} onChangeText={v => set('erpId', v)} keyboardType="numeric" />
                <InputField label="Email" placeholder="yourname@gehu.ac.in" value={form.email} onChangeText={v => set('email', v)} keyboardType="email-address" />
                <InputField label="Phone" placeholder="10-digit number" value={form.phone} onChangeText={v => set('phone', v)} keyboardType="phone-pad" />
                <TouchableOpacity style={styles.btn} onPress={validateStep1}>
                  <Text style={styles.btnText}>Continue →</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Department</Text>
                <View style={styles.chipRow}>
                  {DEPARTMENTS.map(d => (
                    <Chip key={d} label={d} selected={form.department === d} onPress={() => set('department', d)} />
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Year</Text>
                <View style={styles.chipRow}>
                  {YEARS.map(y => (
                    <Chip key={y} label={y} selected={form.year === y} onPress={() => set('year', y)} />
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Section</Text>
                <View style={styles.chipRow}>
                  {SECTIONS.map(s => (
                    <Chip key={s} label={s} selected={form.section === s} onPress={() => set('section', s)} />
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TouchableOpacity style={styles.btnOutline} onPress={() => setStep(1)}>
                    <Text style={styles.btnOutlineText}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={validateStep2}>
                    <Text style={styles.btnText}>Let's Go! 🚀</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const InputField = ({ label, ...props }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput style={styles.input} placeholderTextColor={colors.gray} {...props} />
  </View>
);

const styles = StyleSheet.create({
  bg:          { flex: 1 },
  scroll:      { padding: 24, paddingTop: 60, paddingBottom: 40 },
  logoArea:    { alignItems: 'center', marginBottom: 28 },
  logoCircle:  { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logoEmoji:   { fontSize: 32 },
  appName:     { fontSize: 30, fontWeight: '800', color: colors.white, letterSpacing: 1 },
  tagline:     { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  card:        { backgroundColor: colors.white, borderRadius: radius.xl, padding: 24, ...shadow },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.grayLight },
  progressDotActive: { backgroundColor: colors.blue },
  progressLine: { flex: 1, height: 3, backgroundColor: colors.grayLight, marginHorizontal: 6 },
  progressLineActive: { backgroundColor: colors.blue },
  cardTitle:   { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  cardSub:     { fontSize: 13, color: colors.textSub, marginBottom: 20 },
  fieldLabel:  { fontSize: 12, fontWeight: '600', color: colors.textSub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:       { backgroundColor: colors.offWhite, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.offWhite, borderWidth: 1, borderColor: colors.border },
  chipSelected:{ backgroundColor: colors.navy, borderColor: colors.navy },
  chipText:    { fontSize: 13, color: colors.textSub, fontWeight: '500' },
  chipTextSelected: { color: colors.white },
  btn:         { backgroundColor: colors.navy, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnText:     { color: colors.white, fontWeight: '700', fontSize: 16 },
  btnOutline:  { borderWidth: 2, borderColor: colors.navy, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', marginTop: 8 },
  btnOutlineText: { color: colors.navy, fontWeight: '700', fontSize: 15 },
});
