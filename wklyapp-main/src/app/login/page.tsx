
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getAuth, signInWithEmailAndPassword, type User, sendEmailVerification } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getDoc, doc, getFirestore, setDoc } from "firebase/firestore";
import { LineChart, Eye, EyeOff } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // We need to reload the user to get the latest emailVerified status
      await user.reload();
      const freshUser = auth.currentUser; // Get the reloaded user object

      if (!freshUser) {
        // Should not happen, but as a safeguard
        throw new Error("Could not retrieve user after reload.");
      }

      if (!freshUser.emailVerified) {
         const handleResendVerification = async () => {
          try {
            await sendEmailVerification(freshUser);
            toast({
              title: "Verification Email Sent",
              description: "A new verification link has been sent to your email address. Please check your spam folder.",
            });
          } catch (error) {
            console.error("Error resending verification email:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to send a new verification email. Please try again later.",
            });
          }
        };
        
        toast({
          variant: "destructive",
          title: "Email Not Verified",
          description: "Please verify your email before logging in. Please check your spam folder.",
          duration: 9000,
          action: (
            <ToastAction altText="Resend" onClick={handleResendVerification}>
              Resend
            </ToastAction>
          ),
        });
        await auth.signOut(); // Sign out the user until they verify
        return;
      }
      
      await handleSuccessfulLogin(user);
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
  
  const handleSuccessfulLogin = async (user: User) => {
    const firestore = getFirestore();
    const userDocRef = doc(firestore, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().onboardingComplete) {
        router.push("/dashboard");
    } else {
        // This case handles both new Google sign-in users and email users who haven't completed onboarding.
        // If the doc doesn't exist, create it.
        if (!userDoc.exists()) {
             await setDoc(userDocRef, {
                id: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                startDayOfWeek: 'Sunday',
                onboardingComplete: false,
            }, { merge: true });
        }
        router.push('/setup/welcome');
    }
    toast({
        title: "Login Successful",
        description: "Welcome back!",
    });
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
            Welcome Back
          </h2>
          <p className="mt-2 text-muted-foreground">
            Log in to continue to your dashboard.
          </p>
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
            Log In
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground px-4">
            By logging in, you agree to our{" "}
            <Link href="/privacy" className="text-primary hover:underline font-semibold">
                Privacy Policy
            </Link>.
        </p>
        
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
