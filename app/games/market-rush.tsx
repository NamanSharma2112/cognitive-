import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function MarketRushGame() {
  const router = useRouter();
  const cardBg = useThemeColor({ light: '#f9f9f9', dark: '#1a1a1a' }, 'background');

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ThemedText style={styles.backText}>❮ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Market Rush</ThemedText>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.center}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText style={styles.emoji}>🛒</ThemedText>
          <ThemedText style={styles.gameTitle}>Market Rush</ThemedText>
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>Executive Function</ThemedText>
          </View>
          <ThemedText style={styles.comingSoon}>Coming Soon</ThemedText>
          <ThemedText style={styles.desc}>
            Make quick decisions under time pressure to exercise your executive function skills.
            This game is currently under development.
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15 },
  back: { padding: 5 },
  backText: { fontSize: 20, fontWeight: '700', color: '#0a7ea4' },
  title: { fontSize: 22, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', borderRadius: 24, padding: 30, alignItems: 'center', gap: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 },
  emoji: { fontSize: 64 },
  gameTitle: { fontSize: 28, fontWeight: '900' },
  badge: { backgroundColor: '#0a7ea4' + '22', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#0a7ea4', fontSize: 14, fontWeight: '700' },
  comingSoon: { fontSize: 20, fontWeight: '800', color: '#F39C12', marginTop: 4 },
  desc: { fontSize: 17, textAlign: 'center', opacity: 0.65, lineHeight: 26 },
});
