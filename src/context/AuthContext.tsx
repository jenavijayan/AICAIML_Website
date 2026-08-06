import React, { createContext, useContext, useState, useEffect } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function loadGoogleScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Not in browser'));
  if ((window as any).google?.accounts?.id) return Promise.resolve();

  const id = 'google-identity-services-script';
  if (document.getElementById(id)) {
    return new Promise((resolve, reject) => {
      const check = () => {
        if ((window as any).google?.accounts?.id) resolve();
        else setTimeout(check, 50);
      };
      check();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  membershipPlan: string | null;
  membershipStatus: string;
  permissions: string[];
  photoUrl?: string;
  membershipNo?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
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

  const loginWithGoogle = async () => {
    if (!GOOGLE_CLIENT_ID) {
      return { success: false, error: 'Google Sign-In is not configured.' };
    }

    try {
      await loadGoogleScript();

      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        const handleGoogleResponse = async (response: any) => {
          if (!response || !response.credential) {
            resolve({ success: false, error: 'Google sign-in was cancelled or failed.' });
            return;
          }

          try {
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ idToken: response.credential })
            });
            const text = await res.text();
            let data: any = {};
            if (text) {
              try { data = JSON.parse(text); } catch { data = {}; }
            }

            if (!res.ok) {
              const message = data?.error || data?.message || `Login failed (${res.status}).`;
              resolve({ success: false, error: message });
              return;
            }
            setUser(data.user);
            resolve({ success: true });
          } catch {
            resolve({ success: false, error: 'Unable to reach the server. Please try again.' });
          }
        };

        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification && notification.isNotDisplayed) {
            resolve({ success: false, error: 'Google sign-in is not available right now.' });
          }
        });
      });
    } catch (err) {
      return { success: false, error: 'Unable to initialize Google sign-in.' };
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  const hasPremiumAccess = !!user && (user.role === 'admin' || user.membershipStatus === 'active');

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, hasPremiumAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
