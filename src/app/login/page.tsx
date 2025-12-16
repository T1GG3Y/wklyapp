
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getDoc, doc, getFirestore, setDoc } from "firebase/firestore";
import { LineChart } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const auth = getAuth();
    const firestore = getFirestore();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await user.reload();
      const freshUser = auth.currentUser;

      if (!freshUser?.emailVerified) {
        toast({
          variant: "destructive",
          title: "Email Not Verified",
          description: "Please verify your email before logging in. Check your inbox for a verification link.",
        });
        await auth.signOut();
        return;
      }

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().startDayOfWeek !== 'Sunday') {
         router.push("/dashboard");
      } else {
         router.push('/setup/start-day');
      }

    } catch (error: any) {
      console.error("Error signing in:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error.code) {
        switch (error.code) {
          case "auth/user-not-found":
          case "auth/invalid-credential":
            errorMessage = "Incorrect email or password. Please try again.";
            break;
          case "auth/wrong-password":
            errorMessage = "Incorrect password. Please try again.";
            break;
          case "auth/invalid-email":
            errorMessage = "Please enter a valid email address.";
            break;
          default:
            errorMessage = error.message;
        }
      }
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    }
  };
  
  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const firestore = getFirestore();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          id: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          startDayOfWeek: 'Sunday',
        });
        toast({
          title: "Account Created",
          description: "Welcome to FinanceFlow!",
        });
        router.push('/setup/start-day');
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        if (userDoc.data().startDayOfWeek !== 'Sunday') {
          router.push("/dashboard");
        } else {
          router.push('/setup/start-day');
        }
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
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
                <h1 className="text-2xl font-bold font-headline text-foreground">FinanceFlow</h1>
            </Link>
          <h2 className="text-3xl font-bold font-headline text-foreground">
            Welcome Back
          </h2>
          <p className="mt-2 text-muted-foreground">
            Log in to continue to your dashboard.
          </p>
        </div>

        <div className="space-y-4">
           <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-12 text-base">
            <svg className="mr-2 -ml-1 w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.3 64.5c-24.5-23.4-58.3-38.2-96.6-38.2-73.3 0-133.5 60.5-133.5 134.5s60.2 134.5 133.5 134.5c82.8 0 120.9-61.9 124.8-92.4H248v-83.8h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
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

        <form onSubmit={handleLogin} className="space-y-4 mt-4">
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
            Log In
          </Button>
        </form>
        <p className="mt-8 text-center text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
