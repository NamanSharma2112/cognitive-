import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, Animated, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { postGameSession } from '@/src/lib/api';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type Level = 'Easy' | 'Medium' | 'Hard' | 'Expert';
type GameState = 'START' | 'WAITING' | 'GO' | 'TOO_EARLY' | 'TRIAL_RESULT' | 'FINAL_RESULT';

interface LevelConfig {
  trials: number;
  minDelay: number;
  maxDelay: number;
}

const LEVEL_CONFIGS: Record<Level, LevelConfig> = {
  Easy: { trials: 5, minDelay: 2000, maxDelay: 4000 },
  Medium: { trials: 8, minDelay: 1500, maxDelay: 3500 },
  Hard: { trials: 10, minDelay: 1000, maxDelay: 2500 },
  Expert: { trials: 12, minDelay: 800, maxDelay: 2000 },
};

export default function ReactionSpeedGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>('START');
  const [level, setLevel] = useState<Level>('Easy');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [accuracy, setAccuracy] = useState({ correct: 0, total: 0 });
  const [lastRT, setLastRT] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const startTime = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardBg = useThemeColor({ light: '#f9f9f9', dark: '#1a1a1a' }, 'background');
  const primaryColor = '#0a7ea4';
  const greenColor = '#4ECDC4';
  const redColor = '#FF6B6B';
  const waitColor = '#34495e';

  const startTrials = () => {
    setCurrentTrial(1);
    setReactionTimes([]);
    setAccuracy({ correct: 0, total: 0 });
    nextTrial();
  };

  const nextTrial = () => {
    setGameState('WAITING');
    const config = LEVEL_CONFIGS[level];
    const delay = Math.random() * (config.maxDelay - config.minDelay) + config.minDelay;

    timerRef.current = setTimeout(() => {
      setGameState('GO');
      startTime.current = Date.now();
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, delay);
  };

  const handleScreenTap = () => {
    if (gameState === 'WAITING') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setGameState('TOO_EARLY');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setTimeout(() => {
        proceedToNextOrFinish(false);
      }, 1200);
    } else if (gameState === 'GO') {
      const rt = Date.now() - startTime.current;
      setLastRT(rt);
      setReactionTimes(prev => [...prev, rt]);
      setAccuracy(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      setGameState('TRIAL_RESULT');

      setTimeout(() => {
        proceedToNextOrFinish(true);
      }, 1200);
    }
  };

  const proceedToNextOrFinish = (isCorrect: boolean) => {
    if (!isCorrect) {
       setAccuracy(prev => ({ ...prev, total: prev.total + 1 }));
    }

    if (currentTrial >= LEVEL_CONFIGS[level].trials) {
      setGameState('FINAL_RESULT');
    } else {
      setCurrentTrial(prev => prev + 1);
      nextTrial();
    }
  };

  const getAverageRT = () => {
    if (reactionTimes.length === 0) return 0;
    return Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length);
  };

  const getFastestRT = () => {
    if (reactionTimes.length === 0) return 0;
    return Math.min(...reactionTimes);
  };

  useEffect(() => {
    if (gameState === 'FINAL_RESULT') {
      const avg = getAverageRT();
      setIsSaving(true);
      postGameSession({
        gameId: 'speedy_current',
        level,
        score: avg,
        accuracy: accuracy.total > 0 ? accuracy.correct / accuracy.total : 0,
      })
        .then(() => setSavedOk(true))
        .catch(() => setSavedOk(false))
        .finally(() => setIsSaving(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const isPlaying = () => gameState === 'WAITING' || gameState === 'GO' || gameState === 'TOO_EARLY' || gameState === 'TRIAL_RESULT';

  const getBgColor = () => {
    if (gameState === 'WAITING') return waitColor;
    if (gameState === 'GO') return greenColor;
    if (gameState === 'TOO_EARLY') return redColor;
    if (gameState === 'TRIAL_RESULT') return '#fff';
    return undefined;
  };

  return (
    <ThemedView style={[styles.container, isPlaying() && { backgroundColor: getBgColor() }]}>
      <StatusBar hidden={isPlaying()} />
      <View style={[styles.header, isPlaying() && { borderBottomWidth: 0 }]}>
        <TouchableOpacity onPress={() => { if (timerRef.current) clearTimeout(timerRef.current); router.back(); }} style={styles.backButton}>
          <ThemedText style={[styles.backText, isPlaying() && gameState !== 'TRIAL_RESULT' && { color: '#fff' }]}>❮ Back</ThemedText>
        </TouchableOpacity>
        {gameState === 'TRIAL_RESULT' ? (
          <View style={styles.topResult}>
            <ThemedText style={styles.topRTValue}>{lastRT} ms</ThemedText>
            <ThemedText style={styles.topRTLabel}>Last Speed</ThemedText>
          </View>
        ) : (
          <ThemedText style={[styles.title, isPlaying() && { color: '#fff' }]}>Reaction Speed</ThemedText>
        )}
        <View style={{ width: 60 }} />
      </View>

      {gameState === 'START' && (
        <View style={styles.screen}>
          <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.instruction}>Tap the screen as soon as it turns GREEN!</ThemedText>
            <View style={styles.statsRow}>
              <View style={styles.statItem}><ThemedText style={styles.statLabel}>Trials</ThemedText><ThemedText style={styles.statValue}>{LEVEL_CONFIGS[level].trials}</ThemedText></View>
              <View style={styles.statItem}><ThemedText style={styles.statLabel}>Target</ThemedText><View style={[styles.targetCircle, { backgroundColor: greenColor }]} /></View>
            </View>
            <View style={styles.levelSelector}>
              {(['Easy', 'Medium', 'Hard', 'Expert'] as Level[]).map((l) => (
                <TouchableOpacity key={l} style={[styles.levelBtn, { borderColor: primaryColor }, level === l && { backgroundColor: primaryColor }]} onPress={() => setLevel(l)}>
                  <ThemedText style={[styles.levelBtnText, level === l && { color: '#fff' }]}>{l}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={[styles.mainButton, { backgroundColor: primaryColor }]} onPress={startTrials}>
            <ThemedText style={styles.buttonText}>START TRAINING</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {(gameState === 'WAITING' || gameState === 'GO' || gameState === 'TOO_EARLY' || gameState === 'TRIAL_RESULT') && (
        <TouchableOpacity activeOpacity={1} style={styles.gameArea} onPress={handleScreenTap}>
          <View style={styles.gameOverlay}>
             <ThemedText style={[styles.trialIndicator, isPlaying() && gameState !== 'TRIAL_RESULT' && { color: 'rgba(255,255,255,0.8)' }]}>Trial {currentTrial} / {LEVEL_CONFIGS[level].trials}</ThemedText>
             <View style={styles.feedbackContainer}>
               {gameState === 'WAITING' && <ThemedText style={styles.waitText}>WAIT FOR GREEN...</ThemedText>}
               {gameState === 'GO' && <ThemedText style={styles.goText}>TAP NOW!</ThemedText>}
               {gameState === 'TOO_EARLY' && <View style={styles.errorBox}><ThemedText style={styles.errorText}>TOO EARLY!</ThemedText><ThemedText style={styles.errorSubtext}>Wait for the color change</ThemedText></View>}
               {gameState === 'TRIAL_RESULT' && <View style={styles.rtResultBox}><ThemedText style={styles.largeIcon}>⚡</ThemedText><ThemedText style={styles.greatText}>Great Job!</ThemedText></View>}
             </View>
          </View>
        </TouchableOpacity>
      )}

      {gameState === 'FINAL_RESULT' && (
        <View style={styles.screen}>
          <ThemedText style={styles.resultTitle}>Game Complete!</ThemedText>
          <View style={[styles.resultCard, { backgroundColor: cardBg }]}>
            <View style={styles.resultRow}><ThemedText style={styles.resultLabel}>Average Speed</ThemedText><ThemedText style={styles.resultValue}>{getAverageRT()} ms</ThemedText></View>
            <View style={styles.divider} />
            <View style={styles.resultRow}><ThemedText style={styles.resultLabel}>Best Speed</ThemedText><ThemedText style={[styles.resultValue, { color: greenColor }]}>{getFastestRT()} ms</ThemedText></View>
            <View style={styles.divider} /><View style={styles.resultRow}><ThemedText style={styles.resultLabel}>Accuracy</ThemedText><ThemedText style={styles.resultValue}>{Math.round((accuracy.correct / accuracy.total) * 100)}%</ThemedText></View>
            <View style={styles.divider} />
            <View style={[styles.resultRow, { justifyContent: 'center' }]}>
              {isSaving ? (
                <ActivityIndicator color={primaryColor} />
              ) : savedOk ? (
                <ThemedText style={{ color: '#4ECDC4', fontSize: 18, fontWeight: '700' }}>✓ Score Saved!</ThemedText>
              ) : null}
            </View>
          </View>
          <TouchableOpacity style={[styles.mainButton, { backgroundColor: primaryColor, marginTop: 20 }]} onPress={startTrials}><ThemedText style={styles.buttonText}>TRY AGAIN</ThemedText></TouchableOpacity>
          <TouchableOpacity style={styles.homeButton} onPress={() => router.back()}><ThemedText style={[styles.homeButtonText, { color: primaryColor }]}>Back to Menu</ThemedText></TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, zIndex: 100 },
  backButton: { padding: 5 },
  backText: { fontSize: 20, fontWeight: '700', color: '#0a7ea4' },
  title: { fontSize: 22, fontWeight: '800' },
  topResult: { alignItems: 'center' },
  topRTValue: { fontSize: 28, fontWeight: '900', color: '#0a7ea4' },
  topRTLabel: { fontSize: 12, fontWeight: '700', opacity: 0.5, textTransform: 'uppercase' },
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 40 },
  infoCard: { width: '100%', padding: 25, borderRadius: 25, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  instruction: { fontSize: 22, fontWeight: '700', marginBottom: 25, textAlign: 'center', lineHeight: 30 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 30 },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 14, fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' },
  statValue: { fontSize: 28, fontWeight: '900' },
  targetCircle: { width: 35, height: 35, borderRadius: 17.5, marginTop: 5 },
  levelSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
  levelBtn: { flex: 1, minWidth: '45%', height: 55, borderRadius: 15, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  levelBtnText: { fontSize: 16, fontWeight: '700' },
  mainButton: { width: '100%', height: 70, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  buttonText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  gameArea: { flex: 1, width: '100%' },
  gameOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  trialIndicator: { position: 'absolute', top: 20, fontSize: 22, fontWeight: '800' },
  feedbackContainer: { alignItems: 'center', paddingHorizontal: 20, width: '100%' },
  waitText: { fontSize: 36, fontWeight: '900', color: '#fff', textAlign: 'center' },
  goText: { fontSize: 72, fontWeight: '900', color: '#fff', textAlign: 'center' },
  errorBox: { alignItems: 'center' },
  errorText: { fontSize: 48, fontWeight: '900', color: '#fff' },
  errorSubtext: { fontSize: 22, color: '#fff', opacity: 0.9, marginTop: 10, textAlign: 'center' },
  rtResultBox: { alignItems: 'center' },
  largeIcon: { fontSize: 80, marginBottom: 10 },
  greatText: { fontSize: 40, fontWeight: '900', color: '#0a7ea4' },
  resultTitle: { fontSize: 36, fontWeight: '900', marginBottom: 25 },
  resultCard: { width: '100%', borderRadius: 25, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  resultLabel: { fontSize: 20, fontWeight: '600', opacity: 0.6 },
  resultValue: { fontSize: 28, fontWeight: '900' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)', width: '100%' },
  homeButton: { marginTop: 10, padding: 10 },
  homeButtonText: { fontSize: 20, fontWeight: '700' },
});
