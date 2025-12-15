'use client';

import { FirebaseProvider, initializeFirebase } from '.';

// Re-export for use in app layout.
export {
  useAuth,
  useCollection,
  useDoc,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useUser,
} from '.';

const { firebaseApp, firestore, auth } = initializeFirebase();

/**
 * A client-side provider that initializes Firebase and provides it to the app.
 * The provider ensures that Firebase is initialized only once.
 */
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      {children}
    </FirebaseProvider>
  );
}
