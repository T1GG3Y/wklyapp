
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAuth, applyActionCode } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function VerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const actionCode = searchParams.get('oobCode');
    const mode = searchParams.get('mode');

    if (mode !== 'verifyEmail' || !actionCode) {
      setError('Invalid verification link. Please try again.');
      setStatus('error');
      return;
    }

    const auth = getAuth();
    applyActionCode(auth, actionCode)
      .then(() => {
        setStatus('success');
      })
      .catch((error) => {
        let errorMessage = 'An unknown error occurred.';
        if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'The verification link is invalid or has expired. Please sign up again to get a new link.';
        }
        setError(errorMessage);
        setStatus('error');
      });
  }, [searchParams]);

  const renderStatus = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center gap-4">
            <Loader className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying your email...</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold mb-2">Email Verified!</CardTitle>
            <CardDescription className="mb-6">
              Your email has been successfully verified. You can now log in to your account.
            </CardDescription>
            <Button asChild className="w-full">
              <Link href="/login">Proceed to Login</Link>
            </Button>
          </div>
        );
      case 'error':
        return (
          <div className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold mb-2">Verification Failed</CardTitle>
            <CardDescription className="mb-6 text-destructive-foreground">{error}</CardDescription>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/signup">Back to Signup</Link>
            </Button>
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-md">
        <CardContent className="p-8">
            {renderStatus()}
        </CardContent>
    </Card>
  );
}


export default function VerifyPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmail />
        </Suspense>
    )
}
