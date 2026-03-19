import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { postGameSession } from '@/src/lib/api';

const { width } = Dimensions.get('window');
const GRID_CONTAINER_SIZE = width - 40;

type Level = 'Easy' | 'Medium' | 'Hard';

interface GameLevelConfig {
  gridSize: number;
  maxMoves: number;
  obstacleCount: number;
}

const LEVEL_CONFIGS: Record<Level, GameLevelConfig> = {
  Easy: { gridSize: 4, maxMoves: 8, obstacleCount: 3 },
  Medium: { gridSize: 5, maxMoves: 12, obstacleCount: 6 },
  Hard: { gridSize: 6, maxMoves: 15, obstacleCount: 10 },
};

type GameState = 'START' | 'PLAYING' | 'RESULT';

interface Point {
  x: number;
  y: number;
}

export default function PlanningPuzzleGame() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>('START');
  const [level, setLevel] = useState<Level>('Easy');
  const [playerPos, setPlayerPos] = useState<Point>({ x: 0, y: 0 });
  const [goalPos, setGoalPos] = useState<Point>({ x: 3, y: 3 });
  const [obstacles, setObstacles] = useState<Point[]>([]);
  const [moveHistory, setMoveHistory] = useState<Point[]>([]);
  const [movesLeft, setMovesLeft] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const startTimeRef = useRef<number>(0);

  const cardBg = useThemeColor({ light: '#f9f9f9', dark: '#1a1a1a' }, 'background');
  const btnBg = useThemeColor({ light: '#eee', dark: '#333' }, 'background');
  const primaryColor = '#1A535C';
  const obstacleColor = '#444';
  const goalColor = '#4ECDC4';

  const generatePuzzle = useCallback((currentLevel: Level) => {
    const config = LEVEL_CONFIGS[currentLevel];
    const size = config.gridSize;

    setPlayerPos({ x: 0, y: 0 });
    setGoalPos({ x: size - 1, y: size - 1 });
    setMovesLeft(config.maxMoves);
    setMoveHistory([{ x: 0, y: 0 }]);

    const newObstacles: Point[] = [];
    while (newObstacles.length < config.obstacleCount) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);

      const isStart = x === 0 && y === 0;
      const isGoal = x === size - 1 && y === size - 1;
      const isExist = newObstacles.some(p => p.x === x && p.y === y);

      if (!isStart && !isGoal && !isExist) {
        newObstacles.push({ x, y });
      }
    }
    setObstacles(newObstacles);
  }, []);

  const startGame = () => {
    generatePuzzle(level);
    setGameState('PLAYING');
    setSavedOk(false);
    startTimeRef.current = Date.now();
  };

  const movePlayer = (dx: number, dy: number) => {
    if (gameState !== 'PLAYING' || movesLeft <= 0) return;

    const config = LEVEL_CONFIGS[level];
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    if (newX < 0 || newX >= config.gridSize || newY < 0 || newY >= config.gridSize) return;
    if (obstacles.some(p => p.x === newX && p.y === newY)) return;

    const newPos = { x: newX, y: newY };
    setPlayerPos(newPos);
    setMoveHistory([...moveHistory, newPos]);
    setMovesLeft(prev => prev - 1);

    if (newX === goalPos.x && newY === goalPos.y) {
      setGameState('RESULT');
      const movesUsed = LEVEL_CONFIGS[level].maxMoves - (movesLeft - 1);
      const durationMs = Date.now() - startTimeRef.current;
      setIsSaving(true);
      postGameSession({ gameId: 'path_finder', level, score: movesUsed, durationMs })
        .then(() => setSavedOk(true))
        .catch(() => setSavedOk(false))
        .finally(() => setIsSaving(false));
    } else if (movesLeft === 1) {
      setTimeout(() => {
        Alert.alert('Out of Moves', 'Try again or reset the puzzle.', [
          { text: 'Reset', onPress: resetPuzzle },
          { text: 'Undo', onPress: undoMove }
        ]);
      }, 300);
    }
  };

  const undoMove = () => {
    if (moveHistory.length <= 1) return;
    const history = [...moveHistory];
    history.pop();
    const lastPos = history[history.length - 1];
    setPlayerPos(lastPos);
    setMoveHistory(history);
    setMovesLeft(prev => prev + 1);
  };

  const resetPuzzle = () => {
    const config = LEVEL_CONFIGS[level];
    setPlayerPos({ x: 0, y: 0 });
    setMoveHistory([{ x: 0, y: 0 }]);
    setMovesLeft(config.maxMoves);
  };

  const cellSize = (GRID_CONTAINER_SIZE) / LEVEL_CONFIGS[level].gridSize;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={[styles.backText, { color: primaryColor }]}>❮ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Planning Puzzle</ThemedText>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {gameState === 'START' && (
          <View style={styles.centerBox}>
            <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
              <ThemedText style={styles.instruction}>Think ahead! Reach the flag using the fewest moves possible.</ThemedText>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>Max Moves</ThemedText>
                  <ThemedText style={styles.statValue}>{LEVEL_CONFIGS[level].maxMoves}</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>Goal</ThemedText>
                  <ThemedText style={{ fontSize: 40 }}>🏁</ThemedText>
                </View>
              </View>

              <View style={styles.levelSelector}>
                {(['Easy', 'Medium', 'Hard'] as Level[]).map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[
                      styles.levelBtn,
                      { borderColor: primaryColor },
                      level === l && { backgroundColor: primaryColor }
                    ]}
                    onPress={() => setLevel(l)}
                  >
                    <ThemedText style={[styles.levelBtnText, level === l && { color: '#fff' }]}>{l}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={[styles.mainButton, { backgroundColor: primaryColor }]} onPress={startGame}>
              <ThemedText style={styles.buttonText}>START PUZZLE</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'PLAYING' && (
          <View style={styles.gameArea}>
            <View style={styles.gameHeader}>
              <View style={styles.moveBox}>
                <ThemedText style={styles.moveLabel}>MOVES LEFT</ThemedText>
                <ThemedText style={[styles.moveValue, movesLeft < 3 && { color: '#FF6B6B' }]}>{movesLeft}</ThemedText>
              </View>
              <ThemedText style={styles.levelIndicator}>{level} Grid ({LEVEL_CONFIGS[level].gridSize}x{LEVEL_CONFIGS[level].gridSize})</ThemedText>
            </View>

            <View style={[styles.grid, { width: GRID_CONTAINER_SIZE, height: GRID_CONTAINER_SIZE, backgroundColor: cardBg }]}>
              {Array.from({ length: LEVEL_CONFIGS[level].gridSize }).map((_, row) => (
                <View key={row} style={styles.row}>
                  {Array.from({ length: LEVEL_CONFIGS[level].gridSize }).map((_, col) => {
                    const isPlayer = playerPos.x === col && playerPos.y === row;
                    const isGoal = goalPos.x === col && goalPos.y === row;
                    const isObstacle = obstacles.some(p => p.x === col && p.y === row);

                    return (
                      <View
                        key={col}
                        style={[
                          styles.cell,
                          { width: cellSize, height: cellSize },
                          isObstacle && { backgroundColor: obstacleColor }
                        ]}
                      >
                        {isPlayer && <ThemedText style={{ fontSize: cellSize * 0.55 }}>🏃</ThemedText>}
                        {isGoal && !isPlayer && <ThemedText style={{ fontSize: cellSize * 0.55 }}>🏁</ThemedText>}
                        {isObstacle && <ThemedText style={{ fontSize: cellSize * 0.5 }}>🧱</ThemedText>}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            <View style={styles.controls}>
              <View style={styles.dPad}>
                <View style={styles.dPadRow}>
                  <TouchableOpacity style={[styles.dBtn, { backgroundColor: btnBg }]} onPress={() => movePlayer(0, -1)}>
                    <ThemedText style={styles.dBtnText}>▲</ThemedText>
                  </TouchableOpacity>
                </View>
                <View style={styles.dPadRow}>
                  <TouchableOpacity style={[styles.dBtn, { backgroundColor: btnBg }]} onPress={() => movePlayer(-1, 0)}>
                    <ThemedText style={styles.dBtnText}>◀</ThemedText>
                  </TouchableOpacity>
                  <View style={styles.dBtnSpacer} />
                  <TouchableOpacity style={[styles.dBtn, { backgroundColor: btnBg }]} onPress={() => movePlayer(1, 0)}>
                    <ThemedText style={styles.dBtnText}>▶</ThemedText>
                  </TouchableOpacity>
                </View>
                <View style={styles.dPadRow}>
                  <TouchableOpacity style={[styles.dBtn, { backgroundColor: btnBg }]} onPress={() => movePlayer(0, 1)}>
                    <ThemedText style={styles.dBtnText}>▼</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.actionBtns}>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: primaryColor, backgroundColor: btnBg }]} onPress={undoMove}>
                  <ThemedText style={[styles.actionBtnText, { color: primaryColor }]}>UNDO</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: '#FF6B6B', backgroundColor: btnBg }]} onPress={resetPuzzle}>
                  <ThemedText style={[styles.actionBtnText, { color: '#FF6B6B' }]}>RESET</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {gameState === 'RESULT' && (
          <View style={styles.centerBox}>
            <ThemedText style={styles.resultTitle}>Puzzle Solved! 🧠</ThemedText>

            <View style={[styles.resultCard, { backgroundColor: cardBg }]}>
              <View style={styles.resultRow}>
                <ThemedText style={styles.resultLabel}>Moves Used</ThemedText>
                <ThemedText style={styles.resultValue}>{LEVEL_CONFIGS[level].maxMoves - movesLeft}</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={styles.resultRow}>
                <ThemedText style={styles.resultLabel}>Planning Skill</ThemedText>
                <ThemedText style={[styles.resultValue, { color: goalColor }]}>Excellent</ThemedText>
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
              <ThemedText style={styles.buttonText}>NEXT PUZZLE</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.homeButton} onPress={() => router.back()}>
              <ThemedText style={[styles.homeButtonText, { color: primaryColor }]}>Back to Menu</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15 },
  backButton: { padding: 5 },
  backText: { fontSize: 20, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800' },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 30 },
  infoCard: { width: '100%', padding: 25, borderRadius: 25, alignItems: 'center', gap: 25, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  instruction: { fontSize: 22, textAlign: 'center', fontWeight: '700', lineHeight: 30 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 14, fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' },
  statValue: { fontSize: 28, fontWeight: '900' },
  levelSelector: { flexDirection: 'row', gap: 10, width: '100%' },
  levelBtn: { flex: 1, height: 55, borderRadius: 15, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  levelBtnText: { fontSize: 16, fontWeight: '700' },
  mainButton: { width: '100%', height: 70, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  buttonText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  gameArea: { flex: 1, alignItems: 'center', gap: 20 },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  moveBox: { alignItems: 'center' },
  moveLabel: { fontSize: 12, fontWeight: '800', opacity: 0.5 },
  moveValue: { fontSize: 32, fontWeight: '900' },
  levelIndicator: { fontSize: 18, fontWeight: '700', opacity: 0.6 },
  grid: { borderRadius: 15, overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(0,0,0,0.1)' },
  row: { flexDirection: 'row' },
  cell: { borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  controls: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  dPad: { gap: 5 },
  dPadRow: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dBtn: { width: 65, height: 65, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)' },
  dBtnText: { fontSize: 26, fontWeight: 'bold' },
  dBtnSpacer: { width: 65 },
  actionBtns: { gap: 15 },
  actionBtn: { width: 110, height: 55, borderRadius: 15, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { fontSize: 18, fontWeight: '800' },
  resultTitle: { fontSize: 36, fontWeight: '900' },
  resultCard: { width: '100%', padding: 25, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  resultLabel: { fontSize: 20, fontWeight: '600', opacity: 0.6 },
  resultValue: { fontSize: 28, fontWeight: '900' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)', width: '100%' },
  homeButton: { marginTop: 10, padding: 10 },
  homeButtonText: { fontSize: 20, fontWeight: '700' },
});
