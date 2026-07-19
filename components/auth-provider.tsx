'use client';

import * as React from 'react';
import type { User } from '@/lib/types';
import { api } from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.me().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    async login(email, password) {
      const u = await api.login(email, password);
      setUser(u);
    },
    async register(name, email, password) {
      const u = await api.register(name, email, password);
      setUser(u);
    },
    async logout() {
      await api.logout();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
