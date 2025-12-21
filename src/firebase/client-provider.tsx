
'use client';

import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';
import { useEffect } from 'react';
import { getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '.';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

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
  const { toast } = useToast();
  const router = useRouter();
  const authInstance = useAuth();
  const firestoreInstance = useFirestore();

  useEffect(() => {
    const handleRedirectResult = async () => {
      if (!authInstance || !firestoreInstance) return;

      try {
        const result = await getRedirectResult(authInstance);
        if (result) {
          // This is the signed-in user
          const user = result.user;
          const userDocRef = doc(firestoreInstance, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // New user via redirect
            await setDoc(userDocRef, {
              id: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              startDayOfWeek: 'Sunday',
            });
            toast({
              title: "Account Created",
              description: "Welcome to WKLY!",
            });
            router.push('/setup/start-day');
          } else {
            // Existing user via redirect
            toast({
              title: "Login Successful",
              description: "Welcome back!",
            });
            if (userDoc.data()?.startDayOfWeek && userDoc.data()?.startDayOfWeek !== 'Sunday') {
              router.push("/dashboard");
            } else {
              router.push('/setup/start-day');
            }
          }
        }
      } catch (error: any) {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.customData?.email;
        const credential = GoogleAuthProvider.credentialFromError(error);

        console.error("Google sign-in redirect error:", { errorCode, errorMessage, email, credential });
        toast({
          variant: "destructive",
          title: "Google Sign-In Failed",
          description: errorMessage,
        });
      }
    };

    handleRedirectResult();
  }, [authInstance, firestoreInstance, router, toast]);

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
