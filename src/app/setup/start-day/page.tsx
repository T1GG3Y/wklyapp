'use client';

import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function StartDayScreen() {
  const startDayImage = PlaceHolderImages.find((img) => img.id === 'start-day');
  const [selectedDay, setSelectedDay] = useState('Sunday');
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const handleSetStartDay = async () => {
    if (!user || !firestore) {
      // Should probably show a toast or error message
      console.error('User or firestore not available');
      return;
    }
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(
        userDocRef,
        { startDayOfWeek: selectedDay },
        { merge: true }
      );
      router.push('/setup/income');
    } catch (error) {
      console.error('Error setting start day:', error);
      // Handle error, e.g., show a toast message
    }
  };

  return (
    <div className="bg-background min-h-screen flex flex-col justify-between font-headline">
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            {startDayImage && (
                <div className="relative w-full max-w-[280px] aspect-square mb-8">
                <Image
                    alt={startDayImage.description}
                    src={startDayImage.imageUrl}
                    width={400}
                    height={400}
                    className="w-full h-full object-contain drop-shadow-lg"
                    data-ai-hint={startDayImage.imageHint}
                />
                </div>
            )}
            <div className="w-full">
                <h1 className="text-2xl font-bold text-foreground mb-4 leading-tight">
                    Pick a day to start your week
                </h1>
                <p className="text-muted-foreground mb-8">This helps align your budget and tracking with your personal schedule.</p>
                <div className="flex justify-center items-center gap-2 mb-8">
                    {days.map((day) => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                        'flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all',
                        selectedDay === day
                            ? 'bg-primary text-primary-foreground shadow-md transform scale-105'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                    >
                        <span className="text-sm font-bold">{day.substring(0, 3)}</span>
                    </button>
                    ))}
                </div>
            </div>
        </main>
        <footer className="p-6 pt-0">
            <Button
            onClick={handleSetStartDay}
            className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
            size="lg"
            >
            Set Start Day
            </Button>
      </footer>
    </div>
  );
}
