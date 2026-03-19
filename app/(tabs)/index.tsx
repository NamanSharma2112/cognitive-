import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, ScrollView, TouchableOpacity,
  FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/src/context/AuthContext';
import {
  getGameScores, getAssessmentHistory,
  type GameScore, type AssessmentResult, type GameId,
} from '@/src/lib/api';

// ─── Game Catalogue ──────────────────────────────────────────────────────────
const GAMES: Array<{
  gameId: GameId;
  label: string;
  description: string;
  domain: string;
  domainColor: string;
  route: string;
  emoji: string;
}> = [
  {
    gameId: 'blink_trail',
    label: 'Word Cards',
    description: 'Memorize cards & recall them',
    domain: 'Memory',
    domainColor: '#FF6B6B',
    route: '/games/word-card',
    emoji: '🧠',
  },
  {
    gameId: 'speedy_current',
    label: 'Visual Search',
    description: 'Find the target icon fast',
    domain: 'Attention',
    domainColor: '#4ECDC4',
    route: '/games/visual-search',
    emoji: '🔍',
  },
  {
    gameId: 'path_finder',
    label: 'Planning Puzzle',
    description: 'Navigate grid to the goal',
    domain: 'Planning',
    domainColor: '#1A535C',
    route: '/games/planning-puzzle',
    emoji: '🗺️',
  },
  {
    gameId: 'market_rush',
    label: 'Market Rush',
    description: 'Quick decisions under pressure',
    domain: 'Executive',
    domainColor: '#0a7ea4',
    route: '/games/market-rush',
    emoji: '🛒',
  },
  {
    gameId: 'emotion_meadow',
    label: 'Emotion Meadow',
    description: 'Identify emotional expressions',
    domain: 'Emotion',
    domainColor: '#FFE66D',
    route: '/games/emotion-meadow',
    emoji: '😊',
  },
  {
    gameId: 'sound_forest',
    label: 'Sound Forest',
    description: 'Match sounds to images',
    domain: 'Processing',
    domainColor: '#9B59B6',
    route: '/games/sound-forest',
    emoji: '🌲',
  },
  {
    gameId: 'dual_task_flow',
    label: 'Dual Task Flow',
    description: 'Juggle two tasks at once',
    domain: 'Dual Task',
    domainColor: '#E67E22',
    route: '/games/dual-task-flow',
    emoji: '⚡',
  },
];

// ─── Severity colours ────────────────────────────────────────────────────────
const SEVERITY_COLORS: Record<string, string> = {
  Normal: '#27AE60',
  Mild: '#F39C12',
  Moderate: '#E67E22',
  Severe: '#E74C3C',
};

function getGreeting(name: string): string {
  const h = new Date().getHours();
  let period = 'morning';
  if (h >= 12 && h < 17) period = 'afternoon';
  else if (h >= 17) period = 'evening';
  return `Good ${period}, ${name.split(' ')[0]}!`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [scores, setScores] = useState<GameScore[]>([]);
  const [latestAssessment, setLatestAssessment] = useState<AssessmentResult | null>(null);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cardBg = useThemeColor({ light: '#f9f9f9', dark: '#1a1a1a' }, 'background');
  const borderColor = useThemeColor({ light: 'rgba(0,0,0,0.06)', dark: 'rgba(255,255,255,0.06)' }, 'background');

  const loadData = useCallback(async () => {
    try {
      const [scoresData, historyData] = await Promise.all([
        getGameScores(),
        getAssessmentHistory({ page: 1, limit: 1 }),
      ]);
      setScores(scoresData);
      const total = scoresData.reduce((acc, s) => acc + s.timesPlayed, 0);
      setTotalSessions(total);
      if (historyData.data.length > 0) {
        setLatestAssessment(historyData.data[0]);
      }
    } catch {
      // Silently fail — show empty state
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getBestScore = (gameId: GameId): string => {
    const s = scores.find(s => s.gameId === gameId);
    if (!s || s.bestScore === null) return 'Not played';
    return String(s.bestScore);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greeting}>
              {user ? getGreeting(user.name) : 'Welcome!'}
            </ThemedText>
            <ThemedText style={styles.subGreeting}>Ready for your exercises?</ThemedText>
          </View>
          <TouchableOpacity style={[styles.bellBtn, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.bellIcon}>🔔</ThemedText>
          </TouchableOpacity>
        </View>

        {/* ── Stats Strip ── */}
        <View style={[styles.statsStrip, { backgroundColor: '#0a7ea4' }]}>
          <View style={styles.statCell}>
            <ThemedText style={styles.statNum}>{totalSessions}</ThemedText>
            <ThemedText style={styles.statLbl}>Sessions</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <ThemedText style={styles.statNum}>{scores.filter(s => s.timesPlayed > 0).length}</ThemedText>
            <ThemedText style={styles.statLbl}>Games Tried</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <ThemedText style={styles.statNum}>{scores.length > 0 ? GAMES.length : 0}</ThemedText>
            <ThemedText style={styles.statLbl}>Available</ThemedText>
          </View>
        </View>

        {/* ── Assessment Banner ── */}
        {isLoading ? (
          <View style={[styles.assessmentCard, { backgroundColor: cardBg, borderColor }]}>
            <ActivityIndicator color="#0a7ea4" />
          </View>
        ) : latestAssessment ? (
          <View style={[styles.assessmentCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.assessmentRow}>
              <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLORS[latestAssessment.severity] ?? '#888' }]} />
              <ThemedText style={styles.assessmentTitle}>Last Assessment</ThemedText>
            </View>
            <View style={styles.assessmentBody}>
              <View>
                <ThemedText style={[styles.severityLabel, { color: SEVERITY_COLORS[latestAssessment.severity] }]}>
                  {latestAssessment.severity}
                </ThemedText>
                <ThemedText style={styles.assessmentScore}>Score: {latestAssessment.totalScore}</ThemedText>
              </View>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => router.push('/assessment' as never)}
              >
                <ThemedText style={styles.retakeBtnText}>Retake</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.assessmentBanner, { backgroundColor: '#1A535C' }]}
            onPress={() => router.push('/assessment' as never)}
            activeOpacity={0.85}
          >
            <View>
              <ThemedText style={styles.bannerTitle}>Take Your First Assessment</ThemedText>
              <ThemedText style={styles.bannerSub}>
                Understand your cognitive baseline and personalise your training
              </ThemedText>
            </View>
            <ThemedText style={styles.bannerArrow}>→</ThemedText>
          </TouchableOpacity>
        )}

        {/* ── Games Section ── */}
        <ThemedText style={styles.sectionTitle}>Your Training Games</ThemedText>

        <View style={styles.gamesGrid}>
          {GAMES.map((game) => (
            <TouchableOpacity
              key={game.gameId}
              style={[styles.gameCard, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push(game.route as never)}
              activeOpacity={0.8}
            >
              <View style={styles.gameCardTop}>
                <ThemedText style={styles.gameEmoji}>{game.emoji}</ThemedText>
                <View style={[styles.domainBadge, { backgroundColor: game.domainColor + '22' }]}>
                  <ThemedText style={[styles.domainText, { color: game.domainColor }]}>
                    {game.domain}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.gameName}>{game.label}</ThemedText>
              <ThemedText style={styles.gameDesc} numberOfLines={1}>{game.description}</ThemedText>
              <View style={styles.scoreRow}>
                <ThemedText style={styles.scoreLbl}>Best: </ThemedText>
                <ThemedText style={styles.scoreVal}>{getBestScore(game.gameId)}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greeting: { fontSize: 26, fontWeight: '800', lineHeight: 34 },
  subGreeting: { fontSize: 17, opacity: 0.6, marginTop: 4 },
  bellBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bellIcon: { fontSize: 24 },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 28, fontWeight: '900' },
  statLbl: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },

  // Assessment
  assessmentCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    elevation: 2,
  },
  assessmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  severityDot: { width: 12, height: 12, borderRadius: 6 },
  assessmentTitle: { fontSize: 17, fontWeight: '700', opacity: 0.6 },
  assessmentBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  severityLabel: { fontSize: 26, fontWeight: '900' },
  assessmentScore: { fontSize: 17, opacity: 0.7, marginTop: 2 },
  retakeBtn: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  retakeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  assessmentBanner: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#1A535C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 22, maxWidth: 240 },
  bannerArrow: { color: '#fff', fontSize: 30, fontWeight: '800' },

  // Games
  sectionTitle: { fontSize: 22, fontWeight: '800', paddingHorizontal: 20, marginBottom: 14 },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  gameCard: {
    width: '47%',
    marginHorizontal: '1%',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    gap: 6,
  },
  gameCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gameEmoji: { fontSize: 34 },
  domainBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  domainText: { fontSize: 12, fontWeight: '700' },
  gameName: { fontSize: 17, fontWeight: '800', lineHeight: 22 },
  gameDesc: { fontSize: 13, opacity: 0.6, lineHeight: 18 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  scoreLbl: { fontSize: 13, opacity: 0.5, fontWeight: '600' },
  scoreVal: { fontSize: 13, fontWeight: '800', color: '#0a7ea4' },

  bottomPadding: { height: 20 },
});
