import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  membershipPlan: string | null;
  membershipStatus: string;
  permissions: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPremiumAccess: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const text = await res.text();
        if (!text) {
          setUser(null);
        } else {
          const data = JSON.parse(text);
          setUser(data.user);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const text = await res.text();
      let data: any = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }
      }
      if (!res.ok) {
        const message = data?.error || data?.message || `Login failed (${res.status}).`;
        return { success: false, error: message };
      }
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to reach the server. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore network failures and clear the local session state.
    } finally {
      setUser(null);
    }
  };

  const hasPremiumAccess = !!user && (user.role === 'admin' || user.membershipStatus === 'active');

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPremiumAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
