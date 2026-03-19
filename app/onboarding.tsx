import React, { useState } from 'react';
import {
  StyleSheet, TextInput, TouchableOpacity, View,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/src/context/AuthContext';

const SEX_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;

export default function OnboardingScreen() {
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [medicalCondition, setMedicalCondition] = useState('');
  const [lifestyle, setLifestyle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { saveProfile } = useAuth();

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#ccc', dark: '#555' }, 'text');
  const cardBg = useThemeColor({ light: '#f9f9f9', dark: '#1a1a1a' }, 'background');

  const handleComplete = async () => {
    if (!age || !sex) {
      setError('Please select your Age and Sex to continue.');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 130) {
      setError('Please enter a valid age.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await saveProfile({
        age: ageNum,
        sex,
        medicalConditions: medicalCondition.trim() || undefined,
        lifestyle: lifestyle.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText style={styles.titleText}>Personal Details</ThemedText>
          <ThemedText style={styles.subtitleText}>
            Help us customize your experience by answering a few simple questions.
          </ThemedText>
        </View>

        <View style={styles.form}>
          {/* Age Section */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.largeLabel}>How old are you?</ThemedText>
            <TextInput
              style={[styles.hugeInput, { color: textColor, borderColor }]}
              placeholder="e.g. 75"
              placeholderTextColor="#888"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              maxLength={3}
              editable={!isLoading}
            />
          </View>

          {/* Sex Section */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.largeLabel}>Sex</ThemedText>
            <View style={styles.optionsContainer}>
              {SEX_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    { borderColor },
                    sex === option && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSex(option)}
                  disabled={isLoading}
                >
                  <ThemedText style={[styles.optionText, sex === option && styles.optionTextSelected]}>
                    {option}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Medical Section */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.largeLabel}>Any Medical Conditions?</ThemedText>
            <ThemedText style={styles.smallNote}>Type "None" if you don't have any.</ThemedText>
            <TextInput
              style={[styles.textArea, { color: textColor, borderColor }]}
              placeholder="e.g. Memory loss, Diabetes, Heart issues"
              placeholderTextColor="#888"
              value={medicalCondition}
              onChangeText={setMedicalCondition}
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />
          </View>

          {/* Lifestyle Section */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.largeLabel}>Daily Activities</ThemedText>
            <TextInput
              style={[styles.textArea, { color: textColor, borderColor }]}
              placeholder="e.g. Walking, Reading, Gardening"
              placeholderTextColor="#888"
              value={lifestyle}
              onChangeText={setLifestyle}
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />
          </View>

          {error !== '' && (
            <View style={styles.errorBox}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}

          <TouchableOpacity
            style={[styles.bigButton, isLoading && styles.bigButtonDisabled]}
            onPress={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <ThemedText style={styles.bigButtonText}>SAVE AND START</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  header: { marginBottom: 40 },
  titleText: { fontSize: 36, fontWeight: '800', lineHeight: 44 },
  subtitleText: { fontSize: 20, marginTop: 12, lineHeight: 28, opacity: 0.8 },
  form: { gap: 25 },
  section: {
    padding: 20,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  largeLabel: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  smallNote: { fontSize: 16, opacity: 0.6, marginTop: -8, marginBottom: 4 },
  hugeInput: {
    height: 70,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 28,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 120,
    borderWidth: 2,
    borderRadius: 12,
    padding: 15,
    fontSize: 20,
    textAlignVertical: 'top',
  },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  optionButton: {
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderWidth: 2,
    borderRadius: 30,
    minWidth: 90,
    alignItems: 'center',
  },
  optionButtonSelected: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  optionText: { fontSize: 18, fontWeight: '600' },
  optionTextSelected: { color: '#fff' },
  errorBox: {
    backgroundColor: '#fff0f0',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: { color: '#c0392b', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  bigButton: {
    backgroundColor: '#0a7ea4',
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  bigButtonDisabled: { opacity: 0.7 },
  bigButtonText: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: 1 },
});
