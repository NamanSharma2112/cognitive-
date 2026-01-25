import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function OnboardingScreen() {
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [medicalCondition, setMedicalCondition] = useState('');
  const [lifestyle, setLifestyle] = useState('');

  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#ccc', dark: '#444' }, 'text');

  const handleComplete = () => {
    if (age && sex) {
      // In a real app, save this to your database/backend
      console.log('Saving profile data:', { age, sex, medicalCondition, lifestyle });
      router.replace('/(tabs)');
    } else {
      alert('Please fill in at least Age and Sex');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title">Set Up Your Profile</ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            This helps us tailor the cognitive exercises to your needs.
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText style={styles.label}>Age</ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, borderColor: borderColor }]}
            placeholder="Enter your age"
            placeholderTextColor="#888"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />

          <ThemedText style={styles.label}>Sex</ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, borderColor: borderColor }]}
            placeholder="e.g. Male, Female, Other"
            placeholderTextColor="#888"
            value={sex}
            onChangeText={setSex}
          />

          <ThemedText style={styles.label}>Medical Conditions (if any)</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { color: textColor, borderColor: borderColor }]}
            placeholder="e.g. Diabetes, Heart disease, etc."
            placeholderTextColor="#888"
            value={medicalCondition}
            onChangeText={setMedicalCondition}
            multiline
            numberOfLines={3}
          />

          <ThemedText style={styles.label}>Lifestyle / Activities</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { color: textColor, borderColor: borderColor }]}
            placeholder="e.g. Active, Sedentary, Hobbies"
            placeholderTextColor="#888"
            value={lifestyle}
            onChangeText={setLifestyle}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={styles.button} onPress={handleComplete}>
            <ThemedText style={styles.buttonText}>Start Training</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  subtitle: {
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.7,
  },
  form: {
    gap: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: -5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#0a7ea4',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
