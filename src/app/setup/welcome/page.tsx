'use client';

import { ArrowRight } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const handleContinue = async () => {
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, { onboardingComplete: true }, { merge: true });
    }
    router.push('/income');
  };

  return (
    <div className="bg-background min-h-screen flex flex-col font-body">
      <header className="flex justify-end p-4">
        <button
          onClick={handleContinue}
          className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-sm"
        >
          Continue to My Income
          <ArrowRight className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-6 pt-4">
        <h1 className="text-3xl font-bold text-foreground font-headline mb-8">
          Welcome
        </h1>

        <div className="w-full max-w-lg border border-border rounded-lg p-6 space-y-6 text-foreground text-sm leading-relaxed">
          <p>
            This budget app was developed for the purpose of helping a person/family
            become self-reliant and debt free including medical, auto and home.
            When a person reaches that point, the relaxation and freedom that you
            feel cannot be put into words. This does not come quickly but with
            diligence you will achieve it much younger in life.
          </p>

          <p>
            The foundation for accomplishing this is called <span className="underline">active budgeting</span>. Here you
            enter each income source and each expense category. This allows you to
            see where your money is really going. Where you are overspending you
            can reduce your budget and increase it where needed.
          </p>

          <p>
            This app also allows for <span className="underline">basic budgeting</span>. Enter your income sources and
            then a few basic expense categories like rent and car loan then use the
            custom category for the balance of your expenses. When you enter
            your expenses, everything will be identified as custom except for
            the few basic expense categories you have selected.
          </p>

          <p>
            Enjoy your journey towards debt-free living!
          </p>
        </div>
      </main>
    </div>
  );
}
