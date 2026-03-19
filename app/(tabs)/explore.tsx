import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getProgressSummary, type GameScore, type ProgressSummary } from '@/src/lib/api';

const SEVERITY_COLORS: Record<string, string> = {
  Normal: '#27AE60',
  Mild: '#F39C12',
  Moderate: '#E67E22',
  Severe: '#E74C3C',
};

const DOMAIN_COLORS = ['#0a7ea4', '#FF6B6B', '#9B59B6', '#1A535C', '#E67E22'];
const DOMAIN_LABELS = ['Attention', 'Memory', 'Proc. Speed', 'Planning', 'Dual Task'];

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const router = useRouter();
  const cardBg = useThemeColor({ light: '#f9f9f9', dark: '#1a1a1a' }, 'background');
  const borderColor = useThemeColor({ light: 'rgba(0,0,0,0.06)', dark: 'rgba(255,255,255,0.06)' }, 'background');
  const textColor = useThemeColor({}, 'text');

  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await getProgressSummary();
      setSummary(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load progress data.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  // Build chart datasets from trend
  const buildChartData = (key: 'attention' | 'memory' | 'processingSpeed' | 'planning' | 'dualTask', color: string) => {
    if (!summary?.trend || summary.trend.length === 0) return [];
    return summary.trend.map(w => ({ value: w[key], dataPointColor: color }));
  };

  const chartData = summary?.trend?.length
    ? [
        { label: 'Attention', color: DOMAIN_COLORS[0], data: buildChartData('attention', DOMAIN_COLORS[0]) },
        { label: 'Memory', color: DOMAIN_COLORS[1], data: buildChartData('memory', DOMAIN_COLORS[1]) },
        { label: 'Proc. Speed', color: DOMAIN_COLORS[2], data: buildChartData('processingSpeed', DOMAIN_COLORS[2]) },
        { label: 'Planning', color: DOMAIN_COLORS[3], data: buildChartData('planning', DOMAIN_COLORS[3]) },
        { label: 'Dual Task', color: DOMAIN_COLORS[4], data: buildChartData('dualTask', DOMAIN_COLORS[4]) },
      ]
    : [];

  const latestAsm = summary?.latestAssessment;
  const scores: GameScore[] = summary?.scores ?? [];

  const GAME_LABELS: Record<string, string> = {
    blink_trail: 'Word Cards',
    speedy_current: 'Visual Search',
    path_finder: 'Planning Puzzle',
    market_rush: 'Market Rush',
    emotion_meadow: 'Emotion Meadow',
    sound_forest: 'Sound Forest',
    dual_task_flow: 'Dual Task Flow',
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>My Progress</ThemedText>
          <ThemedText style={styles.subtitle}>Track your cognitive improvement</ThemedText>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0a7ea4" />
            <ThemedText style={styles.loadingText}>Loading your progress…</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <ThemedText style={styles.retryText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Assessment Summary */}
            {latestAsm ? (
              <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                <ThemedText style={styles.cardTitle}>Latest Assessment</ThemedText>
                <View style={[styles.sevBadge, { backgroundColor: (SEVERITY_COLORS[latestAsm.severity] ?? '#888') + '22', borderColor: SEVERITY_COLORS[latestAsm.severity] ?? '#888' }]}>
                  <ThemedText style={[styles.sevText, { color: SEVERITY_COLORS[latestAsm.severity] ?? '#888' }]}>
                    {latestAsm.severity}
                  </ThemedText>
                  <ThemedText style={styles.sevScore}>Score: {latestAsm.totalScore}</ThemedText>
                </View>

                {/* Domain breakdown */}
                {[
                  { label: 'Attention', score: latestAsm.attentionScore, color: DOMAIN_COLORS[0] },
                  { label: 'Short-Term Memory', score: latestAsm.shortTermMemScore, color: DOMAIN_COLORS[1] },
                  { label: 'Long-Term Memory', score: latestAsm.longTermMemScore, color: '#9B59B6' },
                  { label: 'Processing Speed', score: latestAsm.processingSpeedScore, color: DOMAIN_COLORS[2] },
                  { label: 'Daily Living', score: latestAsm.adlScore, color: '#27AE60' },
                ].map(({ label, score, color }) => (
                  <View key={label} style={styles.domainRow}>
                    <ThemedText style={styles.domainLabel}>{label}</ThemedText>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${Math.min(100, score * 5)}%`, backgroundColor: color }]} />
                    </View>
                    <ThemedText style={[styles.domainScore, { color }]}>{score}</ThemedText>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.card, styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
                <ThemedText style={styles.emptyIcon}>📊</ThemedText>
                <ThemedText style={styles.emptyTitle}>No assessment yet</ThemedText>
                <ThemedText style={styles.emptyDesc}>
                  Take an assessment to see your cognitive profile here.
                </ThemedText>
              </View>
            )}

            {/* Weekly Trend Chart */}
            {chartData.length > 0 && (
              <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                <ThemedText style={styles.cardTitle}>Weekly Trend</ThemedText>

                <LineChart
                  data={chartData[0].data}
                  data2={chartData[1].data}
                  data3={chartData[2].data}
                  data4={chartData[3].data}
                  data5={chartData[4].data}
                  color={DOMAIN_COLORS[0]}
                  color2={DOMAIN_COLORS[1]}
                  color3={DOMAIN_COLORS[2]}
                  color4={DOMAIN_COLORS[3]}
                  color5={DOMAIN_COLORS[4]}
                  width={width - 80}
                  height={200}
                  spacing={Math.max(40, (width - 80) / Math.max(chartData[0].data.length, 1))}
                  initialSpacing={20}
                  yAxisTextStyle={{ color: textColor, fontSize: 12 }}
                  xAxisLabelTextStyle={{ color: textColor, fontSize: 11 }}
                  curved
                  hideDataPoints={false}
                  noOfSections={5}
                  maxValue={20}
                />

                {/* Legend */}
                <View style={styles.legend}>
                  {DOMAIN_LABELS.map((lbl, i) => (
                    <View key={lbl} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: DOMAIN_COLORS[i] }]} />
                      <ThemedText style={styles.legendText}>{lbl}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Per-game scores */}
            {scores.length > 0 && (
              <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                <ThemedText style={styles.cardTitle}>Game Scores</ThemedText>
                {scores.map((s) => (
                  <View key={s.gameId} style={styles.scoreRow}>
                    <ThemedText style={styles.gameName} numberOfLines={1}>
                      {GAME_LABELS[s.gameId] ?? s.gameId}
                    </ThemedText>
                    <View style={styles.scoreVals}>
                      <ThemedText style={styles.scoreBest}>Best: {s.bestScore ?? '—'}</ThemedText>
                      <ThemedText style={styles.scorePlayed}>{s.timesPlayed}×</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Assessment CTA */}
        <TouchableOpacity
          style={styles.assessmentBtn}
          onPress={() => router.push('/assessment' as never)}
        >
          <ThemedText style={styles.assessmentBtnText}>📋  Take Assessment</ThemedText>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 32, fontWeight: '900' },
  subtitle: { fontSize: 17, opacity: 0.6, marginTop: 4 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 16 },
  loadingText: { fontSize: 18, opacity: 0.7 },
  errorText: { fontSize: 18, color: '#E74C3C', textAlign: 'center' },
  retryBtn: { backgroundColor: '#0a7ea4', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  retryText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    gap: 12,
  },
  cardTitle: { fontSize: 20, fontWeight: '800' },

  // Assessment card
  sevBadge: { borderRadius: 14, padding: 16, borderWidth: 2, alignItems: 'center', marginBottom: 4 },
  sevText: { fontSize: 30, fontWeight: '900' },
  sevScore: { fontSize: 17, opacity: 0.7, marginTop: 4 },

  // Domain rows
  domainRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  domainLabel: { fontSize: 14, fontWeight: '700', width: 130 },
  barBg: { flex: 1, height: 10, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  domainScore: { fontSize: 17, fontWeight: '900', width: 32, textAlign: 'right' },

  // Empty state
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptyDesc: { fontSize: 16, opacity: 0.6, textAlign: 'center', lineHeight: 24 },

  // Chart legend
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, fontWeight: '600', opacity: 0.8 },

  // Game scores
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.08)' },
  gameName: { fontSize: 16, fontWeight: '700', flex: 1 },
  scoreVals: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  scoreBest: { fontSize: 16, fontWeight: '800', color: '#0a7ea4' },
  scorePlayed: { fontSize: 14, opacity: 0.5, fontWeight: '600' },

  // Assessment button
  assessmentBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#1A535C',
    height: 68,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#1A535C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  assessmentBtnText: { color: '#fff', fontSize: 20, fontWeight: '800' },
});
