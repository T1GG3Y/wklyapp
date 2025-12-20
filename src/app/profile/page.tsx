
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth, useUser } from "@/firebase";
import { getAuth, signOut } from "firebase/auth";
import { LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading, error } = useUser();

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/login");
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
          <Button onClick={handleSignOut} variant="destructive" className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    )
  );
}
