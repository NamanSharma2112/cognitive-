import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';

import {
  authLogin,
  authSignup,
  authLogout,
  getProfile,
  updateProfile,
  storeTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  type ApiUser,
} from '@/src/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: ApiUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  saveProfile: (data: { age?: number; sex?: string; medicalConditions?: string; lifestyle?: string }) => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to rehydrate session from stored token
  useEffect(() => {
    async function rehydrate() {
      try {
        const token = await getAccessToken();
        if (!token) {
          setIsLoading(false);
          router.replace('/login');
          return;
        }

        const profile = await getProfile();
        setUser({ id: profile.id, name: profile.name, email: profile.email });
      } catch {
        // Token expired or invalid — clear and redirect
        await clearTokens();
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    }

    rehydrate();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authLogin(email, password);
    await storeTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await authSignup(name, email, password);
    await storeTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await authLogout(refreshToken);
      }
    } catch {
      // Best-effort logout — always clear locally
    } finally {
      await clearTokens();
      setUser(null);
      router.replace('/login');
    }
  };

  const saveProfile = async (data: {
    age?: number;
    sex?: string;
    medicalConditions?: string;
    lifestyle?: string;
  }) => {
    await updateProfile(data);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, saveProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
