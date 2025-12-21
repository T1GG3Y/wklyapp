
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { getAuth, signOut, deleteUser } from "firebase/auth";
import { LogOut, Shield, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  writeBatch,
  collection,
  getDocs,
  doc,
} from "firebase/firestore";

export default function ProfilePage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading, error } = useUser();
  const { toast } = useToast();

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/login");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !firestore || !auth?.currentUser) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete account. Please try again later.",
      });
      return;
    }

    try {
      // 1. Delete all user data from Firestore
      const collectionsToDelete = [
        "incomeSources",
        "requiredExpenses",
        "discretionaryExpenses",
        "loans",
        "savingsGoals",
        "transactions",
        "weeklySummaries",
      ];

      const batch = writeBatch(firestore);

      for (const subCollection of collectionsToDelete) {
        const querySnapshot = await getDocs(
          collection(firestore, `users/${user.uid}/${subCollection}`)
        );
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }

      // Delete the main user profile document
      const userDocRef = doc(firestore, "users", user.uid);
      batch.delete(userDocRef);

      // Commit the batch delete
      await batch.commit();

      // 2. Delete the user from Firebase Authentication
      await deleteUser(auth.currentUser);

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently removed.",
      });

      router.push("/signup");
    } catch (e: any) {
      console.error("Error deleting account:", e);
      let description = "An unexpected error occurred. Please try again.";
      if (e.code === 'auth/requires-recent-login') {
        description = "This is a sensitive operation. Please sign out and sign back in again before deleting your account.";
      }
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: description,
      });
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    user && (
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-4 pt-2">
        <div className="flex flex-col items-center pt-8">
          <Avatar className="w-24 h-24 mb-4">
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold font-headline">
            {user.displayName || user.email}
          </h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        <div className="p-4 space-y-3">
           <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/privacy">
                <Shield className="mr-2 h-4 w-4" /> Privacy Policy
              </Link>
          </Button>
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/40">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove all of your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSignOut} variant="destructive" className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    )
  );
}
