import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { postGameSession } from '@/src/lib/api';

const { width } = Dimensions.get('window');

type Level = 'Easy' | 'Medium' | 'Hard';

interface GameLevelConfig {
  targetsCount: number;
  totalChoices: number;
  memorizeTime: number;
}

const LEVEL_CONFIGS: Record<Level, GameLevelConfig> = {
  Easy: { targetsCount: 3, totalChoices: 6, memorizeTime: 5 },
  Medium: { targetsCount: 4, totalChoices: 8, memorizeTime: 5 },
  Hard: { targetsCount: 6, totalChoices: 12, memorizeTime: 7 },
};

const ALL_CARDS = [
  { id: 1, word: 'Apple', emoji: '🍎' },
  { id: 2, word: 'Car', emoji: '🚗' },
  { id: 3, word: 'Dog', emoji: '🐶' },
  { id: 4, word: 'House', emoji: '🏠' },
  { id: 5, word: 'Tree', emoji: '🌳' },
  { id: 6, word: 'Book', emoji: '📖' },
  { id: 7, word: 'Sun', emoji: '☀️' },
  { id: 8, word: 'Water', emoji: '💧' },
  { id: 9, word: 'Moon', emoji: '🌙' },
  { id: 10, word: 'Bird', emoji: '🐦' },
  { id: 11, word: 'Phone', emoji: '📱' },
  { id: 12, word: 'Hat', emoji: '🎩' },
  { id: 13, word: 'Shoes', emoji: '👟' },
  { id: 14, word: 'Clock', emoji: '⏰' },
  { id: 15, word: 'Ball', emoji: '⚽' },
  { id: 16, word: 'Star', emoji: '⭐' },
];

type GameState = 'START' | 'MEMORIZE' | 'RECALL' | 'RESULT';

export default function WordCardGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>('START');
  const [level, setLevel] = useState<Level>('Easy');
  const [targetCards, setTargetCards] = useState<typeof ALL_CARDS>([]);
  const [choices, setChoices] = useState<typeof ALL_CARDS>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [timer, setTimer] = useState(5);
  const [score, setScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const cardBg = useThemeColor({ light: '#f9f9f9', dark: '#1a1a1a' }, 'background');
  const primaryColor = '#FF6B6B';

  const startGame = () => {
    const config = LEVEL_CONFIGS[level];
    const shuffled = [...ALL_CARDS].sort(() => 0.5 - Math.random());
    const targets = shuffled.slice(0, config.targetsCount);
    setTargetCards(targets);

    const distractors = shuffled.slice(config.targetsCount, config.totalChoices);
    const allChoices = [...targets, ...distractors].sort(() => 0.5 - Math.random());
    setChoices(allChoices);

    setSelectedIds([]);
    setGameState('MEMORIZE');
    setTimer(config.memorizeTime);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === 'MEMORIZE' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (gameState === 'MEMORIZE' && timer === 0) {
      setGameState('RECALL');
    }
    return () => clearInterval(interval);
  }, [gameState, timer]);

  const toggleSelection = (id: number) => {
    const config = LEVEL_CONFIGS[level];
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      if (selectedIds.length < config.targetsCount) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const checkResults = () => {
    const correctCount = selectedIds.filter(id =>
      targetCards.some(target => target.id === id)
    ).length;
    setScore(correctCount);
    setGameState('RESULT');
    setSavedOk(false);
    const config = LEVEL_CONFIGS[level];
    setIsSaving(true);
    postGameSession({
      gameId: 'blink_trail',
      level,
      score: correctCount,
      accuracy: correctCount / config.targetsCount,
    })
      .then(() => setSavedOk(true))
      .catch(() => setSavedOk(false))
      .finally(() => setIsSaving(false));
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={[styles.backText, { color: primaryColor }]}>❮ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Word Cards</ThemedText>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {gameState === 'START' && (
          <View style={styles.centerBox}>
            <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
              <ThemedText style={styles.instruction}>Memorize the cards, then pick them from a list!</ThemedText>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>Cards</ThemedText>
                  <ThemedText style={styles.statValue}>{LEVEL_CONFIGS[level].targetsCount}</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>Time</ThemedText>
                  <ThemedText style={styles.statValue}>{LEVEL_CONFIGS[level].memorizeTime}s</ThemedText>
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
              <ThemedText style={styles.buttonText}>START TRAINING</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'MEMORIZE' && (
          <View style={styles.gameArea}>
            <ThemedText style={[styles.timerText, { color: primaryColor }]}>Memorize! {timer}s</ThemedText>
            <View style={styles.cardGrid}>
              {targetCards.map((card) => (
                <View key={card.id} style={[styles.card, { backgroundColor: cardBg }]}>
                  <ThemedText style={styles.emoji}>{card.emoji}</ThemedText>
                  <ThemedText style={styles.cardWord}>{card.word}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {gameState === 'RECALL' && (
          <View style={styles.gameArea}>
            <ThemedText style={styles.instruction}>
              Which {LEVEL_CONFIGS[level].targetsCount} cards did you see?
            </ThemedText>
            <ThemedText style={styles.progressText}>
              Selected: {selectedIds.length} / {LEVEL_CONFIGS[level].targetsCount}
            </ThemedText>

            <View style={styles.cardGrid}>
              {choices.map((card) => {
                const isSelected = selectedIds.includes(card.id);
                return (
                  <TouchableOpacity
                    key={card.id}
                    activeOpacity={0.7}
                    style={[
                      styles.card,
                      { backgroundColor: isSelected ? primaryColor : cardBg },
                      isSelected && styles.cardSelected
                    ]}
                    onPress={() => toggleSelection(card.id)}
                  >
                    <ThemedText style={[styles.emoji, isSelected && { opacity: 1 }]}>{card.emoji}</ThemedText>
                    <ThemedText style={[styles.cardWord, isSelected && { color: '#fff' }]}>
                      {card.word}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.mainButton,
                { backgroundColor: primaryColor, marginTop: 20 },
                selectedIds.length < LEVEL_CONFIGS[level].targetsCount && { opacity: 0.5 }
              ]}
              onPress={checkResults}
              disabled={selectedIds.length < LEVEL_CONFIGS[level].targetsCount}
            >
              <ThemedText style={styles.buttonText}>CONFIRM SELECTION</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'RESULT' && (
          <View style={styles.centerBox}>
            <ThemedText style={styles.resultTitle}>
              {score === LEVEL_CONFIGS[level].targetsCount ? 'Perfect! 🌟' : score >= LEVEL_CONFIGS[level].targetsCount / 2 ? 'Well Done!' : 'Keep Trying!'}
            </ThemedText>

            <View style={[styles.resultCard, { backgroundColor: cardBg }]}>
              <View style={styles.resultRow}>
                <ThemedText style={styles.resultLabel}>Correct</ThemedText>
                <ThemedText style={styles.resultValue}>{score} / {LEVEL_CONFIGS[level].targetsCount}</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={styles.resultRow}>
                <ThemedText style={styles.resultLabel}>Difficulty</ThemedText>
                <ThemedText style={styles.resultValue}>{level}</ThemedText>
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
              <ThemedText style={styles.buttonText}>PLAY AGAIN</ThemedText>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  backText: {
    fontSize: 20,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    gap: 20,
  },
  infoCard: {
    width: '100%',
    padding: 25,
    borderRadius: 25,
    alignItems: 'center',
    gap: 25,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  instruction: {
    fontSize: 22,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 30,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '800',
    opacity: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  levelSelector: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  levelBtn: {
    flex: 1,
    height: 55,
    borderRadius: 15,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  mainButton: {
    width: '100%',
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 20,
    fontWeight: '700',
    opacity: 0.6,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  card: {
    width: (width - 70) / 2,
    height: 140,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  emoji: {
    fontSize: 45,
    marginBottom: 10,
  },
  cardWord: {
    fontSize: 20,
    fontWeight: '800',
  },
  resultTitle: {
    fontSize: 40,
    fontWeight: '900',
  },
  resultCard: {
    width: '100%',
    padding: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  resultLabel: {
    fontSize: 20,
    fontWeight: '600',
    opacity: 0.6,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    width: '100%',
  },
  homeButton: {
    marginTop: 10,
    padding: 10,
  },
  homeButtonText: {
    fontSize: 20,
    fontWeight: '700',
  },
});
