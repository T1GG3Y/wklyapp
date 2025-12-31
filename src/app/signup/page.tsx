
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
  type User
} from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { LineChart, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const auth = getAuth();
    
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
      await createUserProfileDocument(user, { displayName: name });


      // Send email verification
      await sendEmailVerification(user);

      toast({
        title: 'Account Created & Verification Sent',
        description: 'Please check your email to verify your account before logging in.',
      });

      // Sign the user out until they are verified
      await auth.signOut();
      
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
  
  const createUserProfileDocument = async (user: User, additionalData = {}) => {
      const firestore = getFirestore();
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const userDoc = await getDoc(userDocRef);

      // Only create the document if it doesn't already exist.
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            startDayOfWeek: 'Sunday', // Default value
            onboardingComplete: false,
            ...additionalData,
        }, { merge: true }); // Merge true is a safeguard
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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                className="h-12 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
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
