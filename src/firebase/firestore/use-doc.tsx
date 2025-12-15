'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  doc,
  onSnapshot,
  type DocumentData,
  type FirestoreError,
} from 'firebase/firestore';

import { useFirestore } from '..';

export const useDoc = <T extends DocumentData>(path: string) => {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  const memoizedPath = useMemo(() => path, [path]);

  useEffect(() => {
    if (!firestore) {
      return;
    }
    // The path must have an even number of segments.
    if (memoizedPath.split('/').length % 2 !== 0) {
      return;
    }
    const docRef = doc(firestore, memoizedPath);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, memoizedPath]);

  return { data, loading, error };
};
