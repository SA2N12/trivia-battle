'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { authApi } from '../lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  isPremium?: boolean;
  totalScore?: number;
  gamesPlayed?: number;
  gamesWon?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('trivia_token');
    if (savedToken) {
      setToken(savedToken);
      authApi
        .getProfile(savedToken)
        .then((profile) => setUser(profile))
        .catch(() => {
          localStorage.removeItem('trivia_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    localStorage.setItem('trivia_token', result.access_token);
    setToken(result.access_token);
    setUser(result.user);
  };

  const register = async (email: string, username: string, password: string) => {
    const result = await authApi.register({ email, username, password });
    localStorage.setItem('trivia_token', result.access_token);
    setToken(result.access_token);
    setUser(result.user);
  };

  const logout = () => {
    localStorage.removeItem('trivia_token');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    const currentToken = token || localStorage.getItem('trivia_token');
    if (!currentToken) return;
    try {
      const profile = await authApi.getProfile(currentToken);
      setUser(profile);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
