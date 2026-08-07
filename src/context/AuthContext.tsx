import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';

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
  memberGoogleLogin: (idToken: string) => Promise<{ success: boolean; error?: string; notApproved?: boolean; status?: string }>;
  logout: () => Promise<void>;
  hasPremiumAccess: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await apiRequest<{ user: any }>('/api/auth/me', { method: 'GET' });
      setUser(data.user);
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
      const data = await apiRequest<{ user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to reach the server. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network failures and clear the local session state.
    } finally {
      setUser(null);
    }
  };

  const memberLogin = async (identifier: string, password: string) => {
    try {
      const data = await apiRequest<{ user: any; code?: string; status?: string }>('/api/auth/member/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      });

      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Unable to reach the server. Please try again.',
        code: err.body?.code,
        status: err.body?.status
      };
    }
  };

  const memberGoogleLogin = async (idToken: string) => {
    try {
      const data = await apiRequest<{ user: any; notApproved?: boolean; status?: string }>(
        '/api/auth/member/google',
        {
          method: 'POST',
          body: JSON.stringify({ idToken })
        }
      );

      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Unable to reach the server. Please try again.',
        notApproved: err.body?.notApproved ?? false,
        status: err.body?.status
      };
    }
  };

  const hasPremiumAccess = !!user && (user.role === 'admin' || user.membershipStatus === 'active');

  return (
    <AuthContext.Provider value={{ user, loading, login, memberLogin, memberGoogleLogin, logout, hasPremiumAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
