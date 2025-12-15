'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  startAt,
  endAt,
  type DocumentData,
  type FirestoreError,
  type Query,
  type Unsubscribe,
} from 'firebase/firestore';

import { useFirestore } from '..';

export type CollectionOptions = {
  where?: [string, any, any] | [string, any, any][];
  orderBy?: [string, 'asc' | 'desc'] | [string, 'asc' | 'desc'][];
  limit?: number;
  limitToLast?: number;
  startAfter?: any;
  endBefore?: any;
  startAt?: any;
  endAt?: any;
};

export const useCollection = <T extends DocumentData>(
  path: string,
  options?: CollectionOptions
) => {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);

  useEffect(() => {
    if (!firestore) {
      return;
    }

    let q: Query = collection(firestore, path);

    if (memoizedOptions?.where) {
      if (Array.isArray(memoizedOptions.where[0])) {
        // @ts-ignore
        memoizedOptions.where.forEach(([field, op, value]) => {
          q = query(q, where(field, op, value));
        });
      } else {
        // @ts-ignore
        q = query(q, where(...memoizedOptions.where));
      }
    }

    if (memoizedOptions?.orderBy) {
      if (Array.isArray(memoizedOptions.orderBy[0])) {
        // @ts-ignore
        memoizedOptions.orderBy.forEach(([field, direction]) => {
          q = query(q, orderBy(field, direction));
        });
      } else {
        // @ts-ignore
        q = query(q, orderBy(...memoizedOptions.orderBy));
      }
    }
    
    if (memoizedOptions?.startAt) {
      q = query(q, startAt(memoizedOptions.startAt));
    }

    if (memoizedOptions?.endAt) {
      q = query(q, endAt(memoizedOptions.endAt));
    }
    
    if (memoizedOptions?.startAfter) {
      q = query(q, startAfter(memoizedOptions.startAfter));
    }

    if (memoizedOptions?.endBefore) {
      q = query(q, endBefore(memoizedOptions.endBefore));
    }

    if (memoizedOptions?.limit) {
      q = query(q, limit(memoizedOptions.limit));
    }

    if (memoizedOptions?.limitToLast) {
      q = query(q, limitToLast(memoizedOptions.limitToLast));
    }

    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: T[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as T)
        );
        setData(data);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path, memoizedOptions]);

  return { data, loading, error };
};
