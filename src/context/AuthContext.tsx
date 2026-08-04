import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  membershipPlan: string | null;
  membershipNo?: string | null;
  membershipStatus: string;
  mustResetPassword?: boolean;
  permissions: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  memberLogin: (identifier: string, password: string) => Promise<{ success: boolean; error?: string; code?: string; status?: string }>;
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

  const memberLogin = async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/auth/member/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password })
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
        return {
          success: false,
          error: data?.error || data?.message || `Login failed (${res.status}).`,
          code: data?.code,
          status: data?.status
        };
      }

      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to reach the server. Please try again.' };
    }
  };

  const hasPremiumAccess = !!user && (user.role === 'admin' || user.membershipStatus === 'active');

  return (
    <AuthContext.Provider value={{ user, loading, login, memberLogin, logout, hasPremiumAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
