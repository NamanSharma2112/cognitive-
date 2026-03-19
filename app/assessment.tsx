import React, { useState } from 'react';
import {
  StyleSheet, View, ScrollView, TouchableOpacity, Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { submitAssessment, type AssessmentResult } from '@/src/lib/api';

// ─── Questions ───────────────────────────────────────────────────────────────
const DOMAINS = [
  {
    key: 'attention' as const,
    label: 'Attention & Concentration',
    color: '#0a7ea4',
    questions: [
      'I have difficulty maintaining attention on a task for several minutes.',
      'I am easily distracted by sounds or activities around me.',
      'I lose focus while reading or watching television.',
      'I find it difficult to follow conversations, especially in a group.',
      'I need information to be repeated because I miss parts of it.',
    ],
  },
  {
    key: 'short_term_memory' as const,
    label: 'Short-Term Memory',
    color: '#FF6B6B',
    questions: [
      'I forget what I was about to do a few moments earlier.',
      'I misplace commonly used objects such as keys, phone, or glasses.',
      'I forget instructions that were given to me recently.',
      'I forget recent conversations or events.',
      'I need reminders for things I was told earlier the same day.',
    ],
  },
  {
    key: 'long_term_memory' as const,
    label: 'Long-Term Memory',
    color: '#9B59B6',
    questions: [
      'I have difficulty recalling events from my past.',
      'I forget the names of people I have known for a long time.',
      'I forget important dates such as birthdays or anniversaries.',
      'I have difficulty remembering information learned long ago.',
      'I find it difficult to clearly recall past experiences.',
    ],
  },
  {
    key: 'processing_speed' as const,
    label: 'Processing Speed',
    color: '#E67E22',
    questions: [
      'I take longer than before to understand instructions.',
      'I need more time to think before responding to questions.',
      'I feel mentally slower while performing simple tasks.',
      'I take longer to complete daily activities than I used to.',
      'I feel that my thinking speed has reduced.',
    ],
  },
  {
    key: 'activities_of_daily_living' as const,
    label: 'Activities of Daily Living',
    color: '#27AE60',
    questions: [
      'I have difficulty managing my personal hygiene (bathing, dressing, grooming).',
      'I have difficulty managing my medications independently.',
      'I have difficulty handling money or paying bills.',
      'I find it difficult to prepare meals independently.',
      'I need help remembering appointments or daily tasks.',
      'I find it difficult to manage household activities as I did before.',
    ],
  },
];

const ANSWERS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];

const SEVERITY_COLORS: Record<string, string> = {
  Normal: '#27AE60',
  Mild: '#F39C12',
  Moderate: '#E67E22',
  Severe: '#E74C3C',
};

type AnswerMap = Record<string, number[]>;

export default function AssessmentScreen() {
  const router = useRouter();
  const cardBg = useThemeColor({ light: '#f9f9f9', dark: '#1a1a1a' }, 'background');
  const borderColor = useThemeColor({ light: 'rgba(0,0,0,0.06)', dark: 'rgba(255,255,255,0.06)' }, 'background');

  const [domainIdx, setDomainIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [submitError, setSubmitError] = useState('');

  const domain = DOMAINS[domainIdx];
  const totalDomains = DOMAINS.length;
  const totalQInDomain = domain.questions.length;

  // Global question index for progress bar
  const globalTotal = DOMAINS.reduce((acc, d) => acc + d.questions.length, 0);
  const globalCurrent = DOMAINS.slice(0, domainIdx).reduce((acc, d) => acc + d.questions.length, 0) + qIdx + 1;

  const handleAnswer = (answerVal: number) => {
    const key = domain.key;
    const current = answers[key] ?? [];
    const updated = [...current];
    updated[qIdx] = answerVal;
    const newAnswers = { ...answers, [key]: updated };
    setAnswers(newAnswers);

    // Auto-advance
    if (qIdx < totalQInDomain - 1) {
      setQIdx(qIdx + 1);
    } else if (domainIdx < totalDomains - 1) {
      setDomainIdx(domainIdx + 1);
      setQIdx(0);
    } else {
      // All done — submit
      submitAll(newAnswers);
    }
  };

  const handleBack = () => {
    if (qIdx > 0) {
      setQIdx(qIdx - 1);
    } else if (domainIdx > 0) {
      const prevDomain = DOMAINS[domainIdx - 1];
      setDomainIdx(domainIdx - 1);
      setQIdx(prevDomain.questions.length - 1);
    } else {
      router.back();
    }
  };

  const submitAll = async (finalAnswers: AnswerMap) => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        attention: (finalAnswers['attention'] ?? []).map((answer, i) => ({ questionNo: i + 1, answer })),
        short_term_memory: (finalAnswers['short_term_memory'] ?? []).map((answer, i) => ({ questionNo: i + 1, answer })),
        long_term_memory: (finalAnswers['long_term_memory'] ?? []).map((answer, i) => ({ questionNo: i + 1, answer })),
        processing_speed: (finalAnswers['processing_speed'] ?? []).map((answer, i) => ({ questionNo: i + 1, answer })),
        activities_of_daily_living: (finalAnswers['activities_of_daily_living'] ?? []).map((answer, i) => ({ questionNo: i + 1, answer })),
      };
      const res = await submitAssessment(payload);
      setResult(res);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading / Submitting screen ──
  if (isSubmitting) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Analysing your responses…</ThemedText>
      </ThemedView>
    );
  }

  // ── Results screen ──
  if (result) {
    const sev = result.severity;
    const sevColor = SEVERITY_COLORS[sev] ?? '#888';
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultScroll}>
          <ThemedText style={styles.resultHeading}>Assessment Complete</ThemedText>

          <View style={[styles.severityCard, { backgroundColor: sevColor + '18', borderColor: sevColor }]}>
            <ThemedText style={[styles.severityBigLabel, { color: sevColor }]}>{sev}</ThemedText>
            <ThemedText style={styles.severityScore}>Total Score: {result.totalScore}</ThemedText>
          </View>

          <ThemedText style={styles.sectionTitle}>Domain Breakdown</ThemedText>

          {[
            { label: 'Attention', score: result.attentionScore, color: '#0a7ea4' },
            { label: 'Short-Term Memory', score: result.shortTermMemScore, color: '#FF6B6B' },
            { label: 'Long-Term Memory', score: result.longTermMemScore, color: '#9B59B6' },
            { label: 'Processing Speed', score: result.processingSpeedScore, color: '#E67E22' },
            { label: 'Daily Living', score: result.adlScore, color: '#27AE60' },
          ].map(({ label, score, color }) => (
            <View key={label} style={[styles.domainRow, { backgroundColor: cardBg, borderColor }]}>
              <ThemedText style={styles.domainLabel}>{label}</ThemedText>
              <View style={styles.domainBarBg}>
                <View style={[styles.domainBarFill, { width: `${Math.min(100, score * 5)}%`, backgroundColor: color }]} />
              </View>
              <ThemedText style={[styles.domainScore, { color }]}>{score}</ThemedText>
            </View>
          ))}

          <TouchableOpacity
            style={styles.startTrainingBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <ThemedText style={styles.startTrainingText}>Start Training →</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    );
  }

  // ── Error screen ──
  if (submitError) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.errorBig}>⚠️</ThemedText>
        <ThemedText style={styles.errorMsg}>{submitError}</ThemedText>
        <TouchableOpacity style={styles.retryBtn} onPress={() => submitAll(answers)}>
          <ThemedText style={styles.retryText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // ── Question screen ──
  const progressPct = ((globalCurrent - 1) / globalTotal) * 100;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ThemedText style={[styles.backText, { color: domain.color }]}>‹ Back</ThemedText>
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <ThemedText style={styles.progressLabel}>Question {globalCurrent} of {globalTotal}</ThemedText>
          <ThemedText style={[styles.domainPill, { color: domain.color }]}>{domain.label}</ThemedText>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: domain.color }]} />
      </View>

      <ScrollView contentContainerStyle={styles.questionScroll}>
        <View style={[styles.questionCard, { backgroundColor: cardBg }]}>
          <ThemedText style={styles.questionText}>{domain.questions[qIdx]}</ThemedText>
        </View>

        <View style={styles.answersContainer}>
          {ANSWERS.map((label, i) => (
            <TouchableOpacity
              key={label}
              style={[styles.answerBtn, { backgroundColor: cardBg, borderColor: domain.color + '44' }]}
              onPress={() => handleAnswer(i)}
              activeOpacity={0.75}
            >
              <View style={[styles.answerDot, { backgroundColor: domain.color }]}>
                <ThemedText style={styles.answerDotText}>{i}</ThemedText>
              </View>
              <ThemedText style={styles.answerLabel}>{label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 20 },
  loadingText: { fontSize: 20, fontWeight: '600', opacity: 0.7, textAlign: 'center' },
  errorBig: { fontSize: 60 },
  errorMsg: { fontSize: 20, fontWeight: '600', textAlign: 'center', color: '#E74C3C' },
  retryBtn: { backgroundColor: '#0a7ea4', paddingVertical: 16, paddingHorizontal: 36, borderRadius: 14 },
  retryText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: { padding: 8 },
  backText: { fontSize: 22, fontWeight: '700' },
  headerMid: { flex: 1, alignItems: 'center', gap: 4 },
  progressLabel: { fontSize: 16, fontWeight: '600', opacity: 0.6 },
  domainPill: { fontSize: 15, fontWeight: '800' },

  // Progress bar
  progressBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.08)', marginHorizontal: 16, borderRadius: 3, marginBottom: 20 },
  progressFill: { height: 6, borderRadius: 3 },

  // Question
  questionScroll: { padding: 20, gap: 16 },
  questionCard: {
    borderRadius: 20,
    padding: 26,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  questionText: { fontSize: 22, fontWeight: '700', lineHeight: 34 },

  // Answers
  answersContainer: { gap: 12, marginTop: 8 },
  answerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    borderRadius: 16,
    paddingHorizontal: 20,
    gap: 16,
    borderWidth: 2,
    elevation: 1,
  },
  answerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerDotText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  answerLabel: { fontSize: 20, fontWeight: '700' },

  // Results
  resultScroll: { padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, gap: 16 },
  resultHeading: { fontSize: 32, fontWeight: '900', marginBottom: 8 },
  severityCard: {
    borderRadius: 18,
    padding: 24,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBigLabel: { fontSize: 44, fontWeight: '900' },
  severityScore: { fontSize: 20, opacity: 0.7, marginTop: 6 },
  sectionTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
  },
  domainLabel: { fontSize: 15, fontWeight: '700', width: 130 },
  domainBarBg: { flex: 1, height: 10, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 5, overflow: 'hidden' },
  domainBarFill: { height: 10, borderRadius: 5 },
  domainScore: { fontSize: 18, fontWeight: '900', width: 36, textAlign: 'right' },
  startTrainingBtn: {
    backgroundColor: '#0a7ea4',
    height: 70,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    elevation: 4,
  },
  startTrainingText: { color: '#fff', fontSize: 22, fontWeight: '800' },
});
