'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let fetchSeq = 0;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      const seq = ++fetchSeq;
      setUser(currentUser);
      
      if (currentUser) {
        getDoc(doc(db, 'users', currentUser.uid))
          .then((snap) => {
            if (cancelled || seq !== fetchSeq) return;
            setUserData(snap.exists() ? snap.data() : null);
          })
          .catch((err) => {
            if (!cancelled && seq === fetchSeq) console.warn('[AuthContext] User data fetch failed:', err);
          })
          .finally(() => {
            if (!cancelled && seq === fetchSeq) setLoading(false);
          });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubAuth();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
