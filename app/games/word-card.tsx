import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width } = Dimensions.get('window');

const ALL_CARDS = [
  { id: 1, word: 'Apple', emoji: '🍎' },
  { id: 2, word: 'Car', emoji: '🚗' },
  { id: 3, word: 'Dog', emoji: '🐶' },
  { id: 4, word: 'House', emoji: '🏠' },
  { id: 5, word: 'Tree', emoji: '🌳' },
  { id: 6, word: 'Book', emoji: '📖' },
  { id: 7, word: 'Sun', emoji: '☀️' },
  { id: 8, word: 'Water', emoji: '💧' },
];

type GameState = 'START' | 'MEMORIZE' | 'RECALL' | 'RESULT';

export default function WordCardGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>('START');
  const [targetCards, setTargetCards] = useState<typeof ALL_CARDS>([]);
  const [choices, setChoices] = useState<typeof ALL_CARDS>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [timer, setTimer] = useState(5);
  const [score, setScore] = useState(0);

  const cardBg = useThemeColor({ light: '#f0f0f0', dark: '#222' }, 'background');
  const selectedColor = '#0a7ea4';

  const startGame = () => {
    // Pick 4 random cards to memorize
    const shuffled = [...ALL_CARDS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);
    setTargetCards(selected);

    // Create choices (the 4 targets + 4 distractors)
    setChoices([...ALL_CARDS].sort(() => 0.5 - Math.random()));

    setSelectedIds([]);
    setGameState('MEMORIZE');
    setTimer(5);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'MEMORIZE' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (gameState === 'MEMORIZE' && timer === 0) {
      setGameState('RECALL');
    }
    return () => clearInterval(interval);
  }, [gameState, timer]);

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      if (selectedIds.length < 4) {
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
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={32} color={selectedColor} />
          <ThemedText style={styles.backText}>Exit</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Word Cards</ThemedText>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {gameState === 'START' && (
          <View style={styles.centerBox}>
            <ThemedText style={styles.instruction}>
              Memorize the cards shown on the screen.
            </ThemedText>
            <TouchableOpacity style={styles.mainButton} onPress={startGame}>
              <ThemedText style={styles.buttonText}>START GAME</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'MEMORIZE' && (
          <View style={styles.centerBox}>
            <ThemedText style={styles.timerText}>Memorize! {timer}s</ThemedText>
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
          <View style={styles.centerBox}>
            <ThemedText style={styles.instruction}>
              Which 4 cards did you see? ({selectedIds.length}/4)
            </ThemedText>
            <View style={styles.cardGrid}>
              {choices.map((card) => {
                const isSelected = selectedIds.includes(card.id);
                return (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.card,
                      { backgroundColor: isSelected ? selectedColor : cardBg }
                    ]}
                    onPress={() => toggleSelection(card.id)}
                  >
                    <ThemedText style={styles.emoji}>{card.emoji}</ThemedText>
                    <ThemedText style={[styles.cardWord, isSelected && { color: '#fff' }]}>
                      {card.word}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.mainButton, selectedIds.length < 4 && { opacity: 0.5 }]}
              onPress={checkResults}
              disabled={selectedIds.length < 4}
            >
              <ThemedText style={styles.buttonText}>CONFIRM</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'RESULT' && (
          <View style={styles.centerBox}>
            <ThemedText style={styles.resultTitle}>
              {score === 4 ? 'Excellent! 🌟' : score >= 2 ? 'Good Job!' : 'Keep Practicing!'}
            </ThemedText>
            <ThemedText style={styles.scoreText}>
              You found {score} out of 4 correct cards.
            </ThemedText>
            <TouchableOpacity style={styles.mainButton} onPress={startGame}>
              <ThemedText style={styles.buttonText}>PLAY AGAIN</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
              <ThemedText style={styles.secondaryButtonText}>GO HOME</ThemedText>
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
    color: '#0a7ea4',
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
  instruction: {
    fontSize: 26,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 34,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0a7ea4',
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
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardWord: {
    fontSize: 22,
    fontWeight: '700',
  },
  mainButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 22,
    textAlign: 'center',
    opacity: 0.8,
  },
  secondaryButton: {
    marginTop: 10,
  },
  secondaryButtonText: {
    fontSize: 20,
    color: '#0a7ea4',
    fontWeight: '700',
  },
});
