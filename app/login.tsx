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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { login } = useAuth();

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#ccc', dark: '#555' }, 'text');
  const inputBg = useThemeColor({ light: '#fff', dark: '#121212' }, 'background');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
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
            <ThemedText style={styles.titleText}>Welcome Back</ThemedText>
            <ThemedText style={styles.subtitleText}>
              Sign in to continue your cognitive exercises.
            </ThemedText>
          </View>

          <View style={styles.form}>
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
              <ThemedText style={styles.largeLabel}>Password</ThemedText>
              <TextInput
                style={[styles.hugeInput, { color: textColor, borderColor, backgroundColor: inputBg }]}
                placeholder="Enter password"
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
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <ThemedText style={styles.bigButtonText}>LOG IN</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>New here? </ThemedText>
              <Link href="/signup">
                <ThemedText style={styles.linkText}>Create an Account</ThemedText>
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
  scrollContent: { flexGrow: 1, padding: 30, justifyContent: 'center' },
  header: { marginBottom: 50, alignItems: 'center' },
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
    marginTop: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  bigButtonDisabled: { opacity: 0.7 },
  bigButtonText: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: 2 },
  footer: { flexDirection: 'column', alignItems: 'center', marginTop: 10, gap: 10 },
  footerText: { fontSize: 20 },
  linkText: { fontSize: 22, color: '#0a7ea4', fontWeight: '700', textDecorationLine: 'underline' },
});
