'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { Auth } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';

type FirebaseContextValue = {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
};

const FirebaseContext = createContext<FirebaseContextValue>({
  firebaseApp: null,
  firestore: null,
  auth: null,
});

type FirebaseProviderProps = {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
};

export const FirebaseProvider = ({
  children,
  firebaseApp,
  firestore,
  auth,
}: FirebaseProviderProps) => (
  <FirebaseContext.Provider value={{ firebaseApp, firestore, auth }}>
    {children}
  </FirebaseContext.Provider>
);

export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => useContext(FirebaseContext).firebaseApp;
export const useFirestore = () => useContext(FirebaseContext).firestore;
export const useAuth = () => useContext(FirebaseContext).auth;
