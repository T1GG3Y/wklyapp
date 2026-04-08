import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { getAuth, GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';

// Initialize GoogleAuth for native platforms
if (Capacitor.isNativePlatform()) {
  GoogleAuth.initialize({
    clientId: '693554017260-kdskvf1cff14g1kucitivje5j6vinikr.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
}

export async function signInWithGoogle() {
  const auth = getAuth();
  
  if (Capacitor.isNativePlatform()) {
    // Native platform (Android/iOS) - use native Google Sign-In
    try {
      const googleUser = await GoogleAuth.signIn();
      
      // Create Firebase credential from the Google ID token
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      
      // Sign in to Firebase with the credential
      const result = await signInWithCredential(auth, credential);
      return result;
    } catch (error: any) {
      console.error('Native Google Sign-In error:', error);
      throw error;
    }
  } else {
    // Web platform - use Firebase popup
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error: any) {
      console.error('Web Google Sign-In error:', error);
      throw error;
    }
  }
}

export async function signOutGoogle() {
  if (Capacitor.isNativePlatform()) {
    try {
      await GoogleAuth.signOut();
    } catch (error) {
      console.error('Google Sign-Out error:', error);
    }
  }
  
  const auth = getAuth();
  await auth.signOut();
}




