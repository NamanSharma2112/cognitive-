import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// ─── Config ────────────────────────────────────────────────────────────────
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

// ─── Token helpers ──────────────────────────────────────────────────────────
export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function storeTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

// ─── Types ──────────────────────────────────────────────────────────────────
export interface ApiUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profile?: {
    age?: number;
    sex?: string;
    medicalConditions?: string;
    lifestyle?: string;
  };
}

export type GameId =
  | 'market_rush'
  | 'speedy_current'
  | 'blink_trail'
  | 'emotion_meadow'
  | 'sound_forest'
  | 'path_finder'
  | 'dual_task_flow';

export type GameLevel = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface GameSessionInput {
  gameId: GameId;
  level: GameLevel;
  score: number;
  accuracy?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface GameScore {
  gameId: GameId;
  bestScore: number | null;
  lastScore: number | null;
  timesPlayed: number;
}

export interface GameSession {
  id: string;
  gameId: GameId;
  level: GameLevel;
  score: number;
  accuracy?: number;
  durationMs?: number;
  createdAt: string;
}

export interface AssessmentAnswer {
  questionNo: number;
  answer: number; // 0=Never 1=Rarely 2=Sometimes 3=Often 4=Always
}

export interface AssessmentInput {
  attention: AssessmentAnswer[];
  short_term_memory: AssessmentAnswer[];
  long_term_memory: AssessmentAnswer[];
  processing_speed: AssessmentAnswer[];
  activities_of_daily_living: AssessmentAnswer[];
}

export interface AssessmentResult {
  attentionScore: number;
  shortTermMemScore: number;
  longTermMemScore: number;
  processingSpeedScore: number;
  adlScore: number;
  totalScore: number;
  severity: 'Normal' | 'Mild' | 'Moderate' | 'Severe';
  createdAt?: string;
}

export interface ProgressSummary {
  trend: Array<{
    week: string;
    attention: number;
    memory: number;
    processingSpeed: number;
    planning: number;
    dualTask: number;
  }>;
  latestAssessment: AssessmentResult | null;
  totalSessions: number;
  scores: GameScore[];
}

export interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

// ─── Core fetch with auto-refresh ──────────────────────────────────────────
let isRefreshing = false;

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Handle 401 → try refresh once
  if (response.status === 401 && !isRetry && !isRefreshing) {
    isRefreshing = true;
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');

      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) throw new Error('Refresh failed');

      const data = await refreshRes.json() as { accessToken: string; refreshToken: string };
      await storeTokens(data.accessToken, data.refreshToken);
      isRefreshing = false;

      // Retry original request with new token
      return apiFetch<T>(path, options, true);
    } catch {
      isRefreshing = false;
      await clearTokens();
      router.replace('/login');
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error((errData as ApiError).error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ─── Auth endpoints ─────────────────────────────────────────────────────────
export async function authSignup(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function authLogin(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function authRefresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('Refresh failed');
  return res.json();
}

export async function authLogout(refreshToken: string): Promise<void> {
  await apiFetch<{ message: string }>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiFetch('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// ─── User endpoints ─────────────────────────────────────────────────────────
export async function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/profile');
}

export async function updateProfile(data: {
  age?: number;
  sex?: string;
  medicalConditions?: string;
  lifestyle?: string;
}): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Game endpoints ──────────────────────────────────────────────────────────
export async function postGameSession(input: GameSessionInput): Promise<GameSession> {
  return apiFetch<GameSession>('/games/session', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getGameScores(): Promise<GameScore[]> {
  return apiFetch<GameScore[]>('/games/scores');
}

export async function getGameSessions(params?: {
  page?: number;
  limit?: number;
  gameId?: GameId;
}): Promise<{ data: GameSession[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.gameId) query.set('gameId', params.gameId);
  return apiFetch(`/games/sessions?${query.toString()}`);
}

// ─── Assessment endpoints ────────────────────────────────────────────────────
export async function submitAssessment(input: AssessmentInput): Promise<AssessmentResult> {
  return apiFetch<AssessmentResult>('/assessment/submit', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getAssessmentHistory(params?: { page?: number; limit?: number }): Promise<{
  data: AssessmentResult[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return apiFetch(`/assessment/history?${query.toString()}`);
}

// ─── Progress endpoints ──────────────────────────────────────────────────────
export async function getProgressSummary(): Promise<ProgressSummary> {
  return apiFetch<ProgressSummary>('/progress/summary');
}
