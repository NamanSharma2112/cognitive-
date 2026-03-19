import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, Animated, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { postGameSession } from '@/src/lib/api';

const { width } = Dimensions.get('window');
const GRID_CONTAINER_SIZE = width - 40;

type Level = 'Easy' | 'Medium' | 'Hard' | 'Expert';

interface GameLevelConfig {
  gridSize: number;
  targetsPerGrid: number;
  timeLimit: number;
  gap: number;
}

const LEVEL_CONFIGS: Record<Level, GameLevelConfig> = {
  Easy: { gridSize: 4, targetsPerGrid: 2, timeLimit: 30, gap: 10 },
  Medium: { gridSize: 5, targetsPerGrid: 3, timeLimit: 25, gap: 8 },
  Hard: { gridSize: 6, targetsPerGrid: 4, timeLimit: 20, gap: 6 },
  Expert: { gridSize: 7, targetsPerGrid: 5, timeLimit: 15, gap: 4 },
};

const ICON_SETS = [
  { target: '🔑', distractors: ['🔐', '🗝️', '🔒', '🔓'] },
  { target: '🍎', distractors: ['🍏', '🍐', '🍊', '🍋'] },
  { target: '🐶', distractors: ['🐱', '🐭', '🐹', '🐰'] },
  { target: '🚗', distractors: ['🚕', '🚙', '🚌', '🚒'] },
  { target: '⭐', distractors: ['🌟', '✨', '💫', '☀️'] },
  { target: '⚽', distractors: ['🏀', '🏈', '⚾', '🎾'] },
];

type GameState = 'START' | 'PLAYING' | 'RESULT';

export default function VisualSearchGame() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>('START');
  const [level, setLevel] = useState<Level>('Easy');
  const [currentTargetSet, setCurrentTargetSet] = useState(ICON_SETS[0]);
  const [grid, setGrid] = useState<string[]>([]);
  const [foundIndices, setFoundIndices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [accuracy, setAccuracy] = useState({ correct: 0, total: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const shakeAnim = useMemo(() => new Animated.Value(0), []);

  const cardBg = useThemeColor({ light: '#f9f9f9', dark: '#1a1a1a' }, 'background');
  const primaryColor = '#4ECDC4';

  const generateGrid = useCallback((currentLevel: Level) => {
    const config = LEVEL_CONFIGS[currentLevel];
    const totalCells = config.gridSize * config.gridSize;
    const newGrid = new Array(totalCells).fill('');

    const set = ICON_SETS[Math.floor(Math.random() * ICON_SETS.length)];
    setCurrentTargetSet(set);

    const targetIndices = new Set<number>();
    while (targetIndices.size < config.targetsPerGrid) {
      targetIndices.add(Math.floor(Math.random() * totalCells));
    }

    for (let i = 0; i < totalCells; i++) {
      if (targetIndices.has(i)) {
        newGrid[i] = set.target;
      } else {
        newGrid[i] = set.distractors[Math.floor(Math.random() * set.distractors.length)];
      }
    }

    setGrid(newGrid);
    setFoundIndices([]);
  }, []);

  const startGame = () => {
    setScore(0);
    setAccuracy({ correct: 0, total: 0 });
    setTimeLeft(LEVEL_CONFIGS[level].timeLimit);
    generateGrid(level);
    setSavedOk(false);
    setGameState('PLAYING');
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState('RESULT');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleTap = (index: number) => {
    if (gameState !== 'PLAYING') return;
    if (foundIndices.includes(index)) return;

    setAccuracy(prev => ({ ...prev, total: prev.total + 1 }));

    if (grid[index] === currentTargetSet.target) {
      const nextFound = [...foundIndices, index];
      setFoundIndices(nextFound);
      setScore(prev => prev + 10);
      setAccuracy(prev => ({ ...prev, correct: prev.correct + 1 }));

      if (nextFound.length === LEVEL_CONFIGS[level].targetsPerGrid) {
        setTimeout(() => {
          if (gameState === 'PLAYING') generateGrid(level);
        }, 300);
      }
    } else {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
      ]).start();
      setScore(prev => Math.max(0, prev - 2));
    }
  };

  useEffect(() => {
    if (gameState === 'RESULT') {
      setIsSaving(true);
      postGameSession({
        gameId: 'speedy_current',
        level,
        score,
        accuracy: accuracy.total > 0 ? accuracy.correct / accuracy.total : 0,
      })
        .then(() => setSavedOk(true))
        .catch(() => setSavedOk(false))
        .finally(() => setIsSaving(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const currentLevelConfig = LEVEL_CONFIGS[level];
  const cellSize = (GRID_CONTAINER_SIZE - (currentLevelConfig.gridSize - 1) * currentLevelConfig.gap) / currentLevelConfig.gridSize;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={[styles.backText, { color: primaryColor }]}>❮ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Visual Search</ThemedText>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        {gameState === 'START' && (
          <View style={styles.centerBox}>
            <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
              <ThemedText style={styles.instruction}>Find the target item!</ThemedText>
              <View style={styles.targetPreview}>
                <ThemedText style={styles.label}>Look for:</ThemedText>
                <View style={styles.targetIconCircle}>
                  <ThemedText style={{ fontSize: 40 }}>{currentTargetSet.target}</ThemedText>
                </View>
              </View>
              <View style={styles.levelRow}>
                {(['Easy', 'Medium', 'Hard', 'Expert'] as Level[]).map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.levelBadge, { borderColor: primaryColor }, level === l && { backgroundColor: primaryColor }]}
                    onPress={() => setLevel(l)}
                  >
                    <ThemedText style={[styles.levelBadgeText, level === l && { color: '#fff' }]}>{l}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={[styles.mainButton, { backgroundColor: primaryColor }]} onPress={startGame}>
              <ThemedText style={styles.buttonText}>START GAME</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'PLAYING' && (
          <View style={styles.gameArea}>
            <View style={styles.gameHeader}>
              <ThemedText style={styles.statValue}>⏱ {timeLeft}s</ThemedText>
              <View style={[styles.targetDisplay, { backgroundColor: cardBg }]}>
                <ThemedText style={{ fontSize: 30 }}>{currentTargetSet.target}</ThemedText>
              </View>
              <ThemedText style={styles.statValue}>Score: {score}</ThemedText>
            </View>
            <Animated.View style={[styles.gridContainer, { transform: [{ translateX: shakeAnim }] }]}>
              {grid.map((icon, index) => {
                const isFound = foundIndices.includes(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor: cardBg, marginRight: (index + 1) % currentLevelConfig.gridSize === 0 ? 0 : currentLevelConfig.gap, marginBottom: currentLevelConfig.gap }, isFound && styles.cellFound]}
                    onPress={() => handleTap(index)}
                    disabled={isFound}
                  >
                    <ThemedText style={{ fontSize: cellSize * 0.5 }}>{icon}</ThemedText>
                    {isFound && <View style={styles.checkOverlay}><ThemedText style={{ fontSize: cellSize * 0.3 }}>✅</ThemedText></View>}
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          </View>
        )}

        {gameState === 'RESULT' && (
          <View style={styles.centerBox}>
            <ThemedText style={styles.resultTitle}>Game Over!</ThemedText>
            <View style={[styles.resultCard, { backgroundColor: cardBg }]}>
              <View style={styles.resultRow}>
                <ThemedText style={styles.resultLabel}>Score</ThemedText>
                <ThemedText style={styles.resultValue}>{score}</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={styles.resultRow}>
                <ThemedText style={styles.resultLabel}>Accuracy</ThemedText>
                <ThemedText style={styles.resultValue}>{accuracy.total > 0 ? Math.round((accuracy.correct / accuracy.total) * 100) : 0}%</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={[styles.resultRow, { justifyContent: 'center' }]}>
                {isSaving ? (
                  <ActivityIndicator color={primaryColor} />
                ) : savedOk ? (
                  <ThemedText style={{ color: '#4ECDC4', fontSize: 18, fontWeight: '700' }}>✓ Score Saved!</ThemedText>
                ) : null}
              </View>
            </View>
            <TouchableOpacity style={[styles.mainButton, { backgroundColor: primaryColor }]} onPress={startGame}>
              <ThemedText style={styles.buttonText}>TRY AGAIN</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.homeButton} onPress={() => router.back()}>
              <ThemedText style={[styles.homeButtonText, { color: primaryColor }]}>Back to Menu</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15 },
  backButton: { padding: 5 },
  backText: { fontSize: 20, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800' },
  content: { flex: 1, padding: 20 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 30 },
  infoCard: { width: '100%', padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  instruction: { fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  targetPreview: { alignItems: 'center', marginBottom: 25 },
  targetIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(78, 205, 196, 0.1)', justifyContent: 'center', alignItems: 'center', marginTop: 10, borderWidth: 2, borderColor: '#4ECDC4' },
  label: { fontSize: 18, opacity: 0.6, fontWeight: '600' },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  levelBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 2 },
  levelBadgeText: { fontSize: 16, fontWeight: '700' },
  mainButton: { width: '100%', height: 70, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  buttonText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  gameArea: { flex: 1, alignItems: 'center', gap: 20 },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 },
  statValue: { fontSize: 24, fontWeight: '900' },
  targetDisplay: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', width: GRID_CONTAINER_SIZE, justifyContent: 'flex-start' },
  cell: { borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  cellFound: { borderColor: '#4ECDC4', borderWidth: 3 },
  checkOverlay: { position: 'absolute', top: -5, right: -5, backgroundColor: '#fff', borderRadius: 12, padding: 2, elevation: 2 },
  resultTitle: { fontSize: 40, fontWeight: '900', marginBottom: 25 },
  resultCard: { width: '100%', borderRadius: 25, padding: 25, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  resultLabel: { fontSize: 22, fontWeight: '600', opacity: 0.6 },
  resultValue: { fontSize: 32, fontWeight: '900' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)', width: '100%' },
  homeButton: { marginTop: 20, padding: 10 },
  homeButtonText: { fontSize: 20, fontWeight: '700' },
});
