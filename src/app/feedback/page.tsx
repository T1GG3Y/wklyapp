'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function FeedbackPage() {
  const [supportRating, setSupportRating] = useState<number | null>(null);
  const [easeOfUse, setEaseOfUse] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const easeOptions = [
    'Very difficult',
    'Somewhat difficult',
    'Neither easy or difficult',
    'Somewhat easy',
    'Very easy',
  ];

  const handleSubmit = () => {
    const body = [
      `Customer Support Rating: ${supportRating || 'Not rated'} / 5`,
      `Ease of Use: ${easeOfUse || 'Not answered'}`,
      `Recommendations: ${recommendations || 'None provided'}`,
    ].join('\n\n');

    const mailtoLink = `mailto:thetiger@alumni.stanford.edu?subject=WKLY Account Deletion Feedback&bcc=weeklybudgetapp@gmail.com&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-background font-headline flex flex-col min-h-screen items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Thank You</h1>
        <p className="text-muted-foreground mb-8">We appreciate your feedback. We wish you the best on your financial journey.</p>
        <Button asChild>
          <Link href="/login">Return to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background font-headline flex flex-col min-h-screen">
      <header className="px-5 py-4 sticky top-0 glass z-20">
        <h1 className="text-2xl font-black uppercase tracking-wide text-foreground text-center">
          We&apos;re Sorry To See You Go
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        <p className="text-muted-foreground text-center mb-6">
          Your account has been deleted. We&apos;d appreciate your feedback to help us improve.
        </p>

        <div className="space-y-6 max-w-md mx-auto">
          {/* Question 1: Customer Support Rating */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">
              How would you rate the customer support?
            </Label>
            <div className="flex gap-3 justify-center">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setSupportRating(num)}
                  className={cn(
                    'size-12 rounded-xl border-2 font-bold text-lg transition-all',
                    supportRating === num
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:bg-muted'
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">1 = Poor, 5 = Excellent</p>
          </div>

          {/* Question 2: Ease of Use */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">
              How easy was this app to use?
            </Label>
            <div className="flex flex-col gap-2">
              {easeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setEaseOfUse(option)}
                  className={cn(
                    'px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all',
                    easeOfUse === option
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:bg-muted'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: Recommendations */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">
              What recommendations would you make?
            </Label>
            <textarea
              className="w-full min-h-[100px] rounded-xl border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your suggestions help us improve..."
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} className="flex-1 h-12 font-semibold text-base">
              Submit Feedback
            </Button>
            <Button asChild variant="outline" className="flex-1 h-12 font-semibold text-base">
              <Link href="/login">Skip</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
