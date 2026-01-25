import { useState, useEffect } from 'react';

// For a university project, we can simulate persistent storage using a global object
// if we don't want to install extra libraries like AsyncStorage immediately.
// However, to make it work across screens properly, we'll use a simple event-based system.

type GameScores = {
  'word-card'?: number;
  'visual-search'?: number;
  'reaction-speed'?: number;
  'planning-puzzle'?: number;
};

// Global state to persist during app session
let globalScores: GameScores = {};
const listeners: Set<(scores: GameScores) => void> = new Set();

const notify = () => listeners.forEach(l => l(globalScores));

export function useGameStorage() {
  const [scores, setScores] = useState<GameScores>(globalScores);

  useEffect(() => {
    const listener = (newScores: GameScores) => setScores({ ...newScores });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const saveScore = (gameId: keyof GameScores, score: number) => {
    globalScores[gameId] = score;
    notify();
  };

  return { scores, saveScore };
}
