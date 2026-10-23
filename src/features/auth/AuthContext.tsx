import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserRole } from '@/types/domain';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  isAdmin: boolean;
  isUser: boolean;
  defaultPlate?: string;
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<AuthUser>;
  register: (
    email: string,
    pass: string,
    displayName: string,
    defaultPlate?: string
  ) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateUserProfile: (data: {
    displayName?: string;
    defaultPlate?: string;
    phone?: string;
  }) => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Fetch or initialize user profile in Firestore users collection
 */
async function fetchOrInitUserProfile(
  fbUser: User,
  explicitRole?: UserRole,
  initialPlate?: string
): Promise<AuthUser> {
  const defaultDisplayName =
    fbUser.displayName || fbUser.email?.split('@')[0] || 'Parking Customer';

  // Role resolution: if email contains 'admin' and no explicit role, grant admin
  const isEmailAdmin = fbUser.email?.toLowerCase().includes('admin') || false;
  const targetRole: UserRole = explicitRole || (isEmailAdmin ? 'admin' : 'user');

  if (!db || !('type' in db)) {
    return {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: defaultDisplayName,
      role: targetRole,
      isAdmin: targetRole === 'admin',
      isUser: targetRole === 'user',
      defaultPlate: initialPlate || '',
    };
  }

  try {
    const userRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      const role: UserRole = data.role === 'admin' ? 'admin' : 'user';
      return {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: data.displayName || defaultDisplayName,
        role,
        isAdmin: role === 'admin',
        isUser: role === 'user',
        defaultPlate: data.defaultPlate || initialPlate || '',
        phone: data.phone || '',
      };
    } else {
      // Create new profile document in Firestore
      const newProfile = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: defaultDisplayName,
        role: targetRole,
        defaultPlate: initialPlate || '',
        phone: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, newProfile);

      return {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: defaultDisplayName,
        role: targetRole,
        isAdmin: targetRole === 'admin',
        isUser: targetRole === 'user',
        defaultPlate: initialPlate || '',
        phone: '',
      };
    }
  } catch (err) {
    console.warn('Firestore user profile fetch error, using fallback:', err);
    return {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: defaultDisplayName,
      role: targetRole,
      isAdmin: targetRole === 'admin',
      isUser: targetRole === 'user',
      defaultPlate: initialPlate || '',
    };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Clean up any lingering legacy demo session
    try {
      localStorage.removeItem('smartpark_demo_session');
    } catch {
      // Ignore
    }

    if (auth && typeof onAuthStateChanged === 'function') {
      try {
        const unsubscribe = onAuthStateChanged(auth, async fbUser => {
          if (fbUser) {
            try {
              const profile = await fetchOrInitUserProfile(fbUser);
              setUser(profile);
            } catch (err) {
              console.error('Failed to resolve user profile:', err);
              setUser(null);
            }
          } else {
            setUser(null);
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

  const login = async (email: string, pass: string): Promise<AuthUser> => {
    setLoading(true);
    try {
      if (auth && typeof signInWithEmailAndPassword === 'function') {
        const res = await signInWithEmailAndPassword(auth, email, pass);
        const profile = await fetchOrInitUserProfile(res.user);
        setUser(profile);
        return profile;
      } else {
        throw new Error('Firebase Auth unavailable');
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password. Please verify your credentials.');
      } else if (err.code === 'auth/user-not-found') {
        throw new Error('No registered account found with this email.');
      } else if (err.code === 'auth/too-many-requests') {
        throw new Error('Access temporarily disabled due to failed attempts. Try again later.');
      } else if (err.code === 'auth/network-request-failed') {
        throw new Error('Network error. Check your internet connection.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    pass: string,
    displayName: string,
    defaultPlate?: string
  ): Promise<AuthUser> => {
    setLoading(true);
    try {
      if (auth && typeof createUserWithEmailAndPassword === 'function') {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        if (displayName) {
          try {
            await fbUpdateProfile(res.user, { displayName });
          } catch (e) {
            console.warn('Could not update displayName:', e);
          }
        }
        // Public registration always assigns 'user' role
        const profile = await fetchOrInitUserProfile(res.user, 'user', defaultPlate);
        setUser(profile);
        return profile;
      } else {
        throw new Error('Firebase Auth registration unavailable');
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: {
    displayName?: string;
    defaultPlate?: string;
    phone?: string;
  }) => {
    if (!user) return;

    const updatedUser: AuthUser = {
      ...user,
      displayName: data.displayName !== undefined ? data.displayName : user.displayName,
      defaultPlate: data.defaultPlate !== undefined ? data.defaultPlate : user.defaultPlate,
      phone: data.phone !== undefined ? data.phone : user.phone,
    };
    setUser(updatedUser);

    if (db && 'type' in db && !user.uid.startsWith('demo-')) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          ...(data.displayName ? { displayName: data.displayName } : {}),
          ...(data.defaultPlate !== undefined ? { defaultPlate: data.defaultPlate } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Failed to update Firestore profile document:', err);
      }
    }
  };

  const logout = async () => {
    try {
      if (auth && typeof fbSignOut === 'function') {
        await fbSignOut(auth);
      }
    } catch (err) {
      console.warn('Firebase logout notice:', err);
    }
    setUser(null);
  };

  const getIdToken = async (): Promise<string | null> => {
    if (auth && auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
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
