import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width } = Dimensions.get('window');

type Level = 'Easy' | 'Medium' | 'Hard';

interface GameLevelConfig {
  gridSize: number;
  targetsToFind: number;
  timeLimit: number;
}

const LEVEL_CONFIGS: Record<Level, GameLevelConfig> = {
  Easy: { gridSize: 4, targetsToFind: 2, timeLimit: 30 },
  Medium: { gridSize: 5, targetsToFind: 4, timeLimit: 25 },
  Hard: { gridSize: 6, targetsToFind: 6, timeLimit: 20 },
};

const ICON_SETS = [
  { target: 'key.fill', distractors: ['lock.fill', 'lock.open.fill', 'key.horizontal.fill'] },
  { target: 'applelogo', distractors: ['leaf.fill', 'sun.max.fill', 'drop.fill'] }, // Placeholder-ish
  { target: 'star.fill', distractors: ['star', 'star.leadinghalf.filled', 'circle.fill'] },
  { target: 'heart.fill', distractors: ['heart', 'suit.heart.fill', 'bolt.fill'] },
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

  const cardBg = useThemeColor({ light: '#f9f9f9', dark: '#1a1a1a' }, 'background');
  const selectedColor = '#4ECDC4';
  const errorColor = '#FF6B6B';

  const generateGrid = useCallback((currentLevel: Level) => {
    const config = LEVEL_CONFIGS[currentLevel];
    const totalCells = config.gridSize * config.gridSize;
    const newGrid = new Array(totalCells).fill('');

    // Pick a random icon set
    const set = ICON_SETS[Math.floor(Math.random() * ICON_SETS.length)];
    setCurrentTargetSet(set);

    // Place targets
    const targetIndices = new Set<number>();
    while (targetIndices.size < config.targetsToFind) {
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
    setGameState('PLAYING');
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
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
      setFoundIndices(prev => [...prev, index]);
      setScore(prev => prev + 10);
      setAccuracy(prev => ({ ...prev, correct: prev.correct + 1 }));

      // If all targets found in this grid, generate a new one
      if (foundIndices.length + 1 === LEVEL_CONFIGS[level].targetsToFind) {
        generateGrid(level);
      }
    } else {
      // Penalty or just feedback
      setScore(prev => Math.max(0, prev - 2));
    }
  };

  const getAccuracyPercentage = () => {
    if (accuracy.total === 0) return 0;
    return Math.round((accuracy.correct / accuracy.total) * 100);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={32} color={selectedColor} />
          <ThemedText style={styles.backText}>Exit</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Visual Search</ThemedText>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {gameState === 'START' && (
          <View style={styles.centerBox}>
            <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
              <ThemedText style={styles.instruction}>Find the target as fast as you can!</ThemedText>
              <View style={styles.targetPreview}>
                <ThemedText style={styles.label}>Target:</ThemedText>
                <IconSymbol name={currentTargetSet.target as any} size={50} color={selectedColor} />
              </View>
              <View style={styles.statsRow}>
                <ThemedText style={styles.statLabel}>Time: {LEVEL_CONFIGS[level].timeLimit}s</ThemedText>
                <ThemedText style={styles.statLabel}>Difficulty: {level}</ThemedText>
              </View>
            </View>

            <View style={styles.levelSelector}>
              {(['Easy', 'Medium', 'Hard'] as Level[]).map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.levelBtn, level === l && { backgroundColor: selectedColor, borderColor: selectedColor }]}
                  onPress={() => setLevel(l)}
                >
                  <ThemedText style={[styles.levelBtnText, level === l && { color: '#fff' }]}>{l}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.mainButton, { backgroundColor: selectedColor }]} onPress={startGame}>
              <ThemedText style={styles.buttonText}>START</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'PLAYING' && (
          <View style={styles.gameArea}>
            <View style={styles.gameStats}>
              <ThemedText style={styles.timerText}>⏱ {timeLeft}s</ThemedText>
              <ThemedText style={styles.scoreText}>Score: {score}</ThemedText>
            </View>

            <View style={[styles.findBar, { backgroundColor: cardBg }]}>
              <ThemedText style={styles.findLabel}>🔎 Find:</ThemedText>
              <IconSymbol name={currentTargetSet.target as any} size={30} color={selectedColor} />
            </View>

            <View style={[styles.grid, { width: width - 40, height: width - 40 }]}>
              {grid.map((icon, index) => {
                const isFound = foundIndices.includes(index);
                const cellSize = (width - 60) / LEVEL_CONFIGS[level].gridSize;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.cell,
                      { width: cellSize, height: cellSize, backgroundColor: cardBg },
                      isFound && { backgroundColor: 'rgba(78, 205, 196, 0.2)', borderColor: selectedColor, borderWidth: 2 }
                    ]}
                    onPress={() => handleTap(index)}
                    disabled={isFound}
                  >
                    <IconSymbol
                      name={icon as any}
                      size={cellSize * 0.6}
                      color={isFound ? selectedColor : '#888'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {gameState === 'RESULT' && (
          <View style={styles.centerBox}>
            <ThemedText style={styles.resultTitle}>Great Job! 🎯</ThemedText>

            <View style={[styles.resultCard, { backgroundColor: cardBg }]}>
              <View style={styles.resultRow}>
                <ThemedText style={styles.resultLabel}>Final Score:</ThemedText>
                <ThemedText style={styles.resultValue}>{score}</ThemedText>
              </View>
              <View style={styles.resultRow}>
                <ThemedText style={styles.resultLabel}>Accuracy:</ThemedText>
                <ThemedText style={styles.resultValue}>{getAccuracyPercentage()}%</ThemedText>
              </View>
              <View style={styles.resultRow}>
                <ThemedText style={styles.resultLabel}>Found:</ThemedText>
                <ThemedText style={styles.resultValue}>{accuracy.correct}</ThemedText>
              </View>
            </View>

            <TouchableOpacity style={[styles.mainButton, { backgroundColor: selectedColor }]} onPress={startGame}>
              <ThemedText style={styles.buttonText}>PLAY AGAIN</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
              <ThemedText style={[styles.secondaryButtonText, { color: selectedColor }]}>GO HOME</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  infoCard: {
    width: '100%',
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  instruction: {
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '700',
  },
  targetPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  label: {
    fontSize: 22,
    fontWeight: '600',
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 10,
  },
  statLabel: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.6,
  },
  levelSelector: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  levelBtn: {
    flex: 1,
    height: 60,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  mainButton: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    gap: 20,
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '800',
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '800',
  },
  findBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 40,
    gap: 15,
  },
  findLabel: {
    fontSize: 22,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'center',
    alignContent: 'center',
  },
  cell: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  resultTitle: {
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
  },
  resultCard: {
    width: '100%',
    padding: 30,
    borderRadius: 25,
    gap: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 22,
    fontWeight: '600',
    opacity: 0.7,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  secondaryButton: {
    marginTop: 10,
  },
  secondaryButtonText: {
    fontSize: 22,
    fontWeight: '700',
  },
});
