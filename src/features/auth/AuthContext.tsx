import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginAsDemo: (role?: 'user' | 'admin') => void;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USER_KEY = 'smartpark_demo_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Check if demo user session was saved
    const saved = localStorage.getItem(DEMO_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if real Firebase auth is functional
    if (auth && typeof onAuthStateChanged === 'function') {
      try {
        const unsubscribe = onAuthStateChanged(auth, async fbUser => {
          if (fbUser) {
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Operator',
              isAdmin: fbUser.email?.includes('admin') || false,
            });
            localStorage.removeItem(DEMO_USER_KEY);
          } else {
            // Check if demo mode was active
            const saved = localStorage.getItem(DEMO_USER_KEY);
            if (saved) {
              try {
                setUser(JSON.parse(saved));
              } catch {
                setUser(null);
              }
            } else {
              setUser(null);
            }
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.warn('Firebase onAuthStateChanged error:', err);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (auth && typeof signInWithEmailAndPassword === 'function') {
        const res = await signInWithEmailAndPassword(auth, email, pass);
        const fbUser = res.user;
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Operator',
          isAdmin: email.includes('admin'),
        });
        localStorage.removeItem(DEMO_USER_KEY);
      } else {
        throw new Error('Firebase Auth unavailable');
      }
    } catch (err: any) {
      setLoading(false);
      // Map Firebase error codes to friendly strings
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password. Please check your credentials.');
      } else if (err.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else if (err.code === 'auth/too-many-requests') {
        throw new Error('Access temporarily disabled due to too many failed attempts. Try again later.');
      } else if (err.code === 'auth/network-request-failed') {
        throw new Error('Network error. Check your connection or test using Demo Mode.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = (role: 'user' | 'admin' = 'admin') => {
    const demoProfile: AuthUser = {
      uid: role === 'admin' ? 'demo-admin-id' : 'demo-user-1',
      email: role === 'admin' ? 'admin@smartparking.iot' : 'driver@smartparking.iot',
      displayName: role === 'admin' ? 'Admin Station' : 'Driver Alex',
      isAdmin: role === 'admin',
    };
    setUser(demoProfile);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoProfile));
  };

  const logout = async () => {
    try {
      if (auth && typeof fbSignOut === 'function') {
        await fbSignOut(auth);
      }
    } catch (err) {
      console.warn('Firebase logout notice:', err);
    }
    localStorage.removeItem(DEMO_USER_KEY);
    setUser(null);
  };

  const getIdToken = async (): Promise<string | null> => {
    if (auth && auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return user ? 'mock-demo-id-token' : null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginAsDemo,
        logout,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
