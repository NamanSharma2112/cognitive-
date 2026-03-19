import React, { useState } from 'react';
import {
  StyleSheet, TextInput, TouchableOpacity, View,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/src/context/AuthContext';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { signup } = useAuth();

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#ccc', dark: '#555' }, 'text');
  const inputBg = useThemeColor({ light: '#fff', dark: '#121212' }, 'background');

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all details to create your account.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
      router.replace('/onboarding');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <ThemedText style={styles.titleText}>Join Us</ThemedText>
            <ThemedText style={styles.subtitleText}>
              Create an account to start your cognitive health journey.
            </ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.largeLabel}>Full Name</ThemedText>
              <TextInput
                style={[styles.hugeInput, { color: textColor, borderColor, backgroundColor: inputBg }]}
                placeholder="Enter your name"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.largeLabel}>Email Address</ThemedText>
              <TextInput
                style={[styles.hugeInput, { color: textColor, borderColor, backgroundColor: inputBg }]}
                placeholder="email@example.com"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.largeLabel}>Create Password</ThemedText>
              <TextInput
                style={[styles.hugeInput, { color: textColor, borderColor, backgroundColor: inputBg }]}
                placeholder="Choose a password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
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
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <ThemedText style={styles.bigButtonText}>CREATE ACCOUNT</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>Already have an account? </ThemedText>
              <Link href="/login">
                <ThemedText style={styles.linkText}>Log In Instead</ThemedText>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 30, paddingTop: 60 },
  header: { marginBottom: 40, alignItems: 'center' },
  titleText: { fontSize: 40, fontWeight: '800', textAlign: 'center' },
  subtitleText: { fontSize: 22, marginTop: 15, textAlign: 'center', opacity: 0.8, lineHeight: 30 },
  form: { gap: 24 },
  inputGroup: { gap: 10 },
  largeLabel: { fontSize: 22, fontWeight: '700' },
  hugeInput: {
    height: 75,
    borderWidth: 2,
    borderRadius: 15,
    paddingHorizontal: 20,
    fontSize: 22,
  },
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
    height: 85,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  bigButtonDisabled: { opacity: 0.7 },
  bigButtonText: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: 1 },
  footer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
    marginBottom: 40,
  },
  footerText: { fontSize: 20 },
  linkText: { fontSize: 22, color: '#0a7ea4', fontWeight: '700', textDecorationLine: 'underline' },
});
