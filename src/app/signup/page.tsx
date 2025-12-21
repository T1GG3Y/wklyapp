
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithRedirect,
} from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { LineChart } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const auth = getAuth();
    const firestore = getFirestore();

    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'Password should be at least 6 characters.',
      });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, { displayName: name });

      // Create a user profile document in Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        displayName: name,
        photoURL: user.photoURL,
        startDayOfWeek: 'Sunday', // Default value
      });

      // Send email verification
      await sendEmailVerification(user);

      toast({
        title: 'Account Created & Verification Sent',
        description: 'Please check your email to verify your account before logging in.',
      });
      router.push('/login'); // Redirect to login page to wait for verification
    } catch (error: any) {
      console.error('Error signing up:', error);
      let errorMessage = 'An unexpected error occurred.';
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage =
              'This email is already in use. Please log in or use a different email.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          default:
            errorMessage = error.message;
        }
      }
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: errorMessage,
      });
    }
  };
  
  const handleGoogleSignup = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      // Use signInWithRedirect instead of signInWithPopup
      await signInWithRedirect(auth, provider);
    } catch (error: any)
     {
      console.error("Google sign-up error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign-Up Failed",
        description: error.message,
      });
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 font-body">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <LineChart className="text-primary h-8 w-8" />
                <h1 className="text-2xl font-bold font-headline text-foreground">WKLY</h1>
            </Link>
          <h2 className="text-3xl font-bold font-headline text-foreground">
            Create an Account
          </h2>
          <p className="mt-2 text-muted-foreground">
            Start your journey with WKLY today.
          </p>
        </div>
        <div className="space-y-4">
           <Button onClick={handleGoogleSignup} variant="outline" className="w-full h-12 text-base">
            <svg className="mr-2 -ml-1 w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.3 64.5c-24.5-23.4-58.3-38.2-96.6-38.2-73.3 0-133.5 60.5-133.5 134.5s60.2 134.5 133.5 134_5c82.8 0 120.9-61.9 124.8-92.4H248v-83.8h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>
        </div>
        <form onSubmit={handleSignup} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              required
              className="h-12"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              className="h-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              className="h-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-destructive text-sm font-medium">{error}</p>}
          <Button type="submit" className="w-full h-12 text-lg font-bold">
            Create Account
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground px-4">
            By creating an account, you agree to our{" "}
            <Link href="/privacy" className="text-primary hover:underline font-semibold">
                Privacy Policy
            </Link>.
        </p>

        <p className="mt-8 text-center text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
