import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LineChart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const welcomeImage = PlaceHolderImages.find((img) => img.id === 'welcome-screen');

  return (
    <div className="flex flex-col h-screen justify-between overflow-hidden bg-background">
      <div className="h-2 w-full shrink-0"></div>
      <main className="flex-1 flex flex-col relative w-full h-full justify-center">
        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full items-center">
          <div className="w-full flex-shrink-0 snap-center px-6 flex flex-col justify-center items-center gap-8 h-full pb-20 pt-4">
            {welcomeImage && (
              <div className="w-full aspect-[4/5] max-h-[50vh] rounded-3xl overflow-hidden shadow-2xl relative bg-white/5 border border-white/10 group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 z-10"></div>
                <Image
                  src={welcomeImage.imageUrl}
                  alt={welcomeImage.description}
                  fill
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                  data-ai-hint={welcomeImage.imageHint}
                />
                <div className="absolute top-4 right-4 bg-background/50 backdrop-blur-md p-3 rounded-full border border-primary/20 z-20">
                  <LineChart className="text-primary h-6 w-6" />
                </div>
              </div>
            )}
            <div className="text-center space-y-3 max-w-xs">
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight font-headline">
                Track Every Penny
              </h2>
              <p className="text-muted-foreground text-base font-medium leading-relaxed">
                Real-time insights into where your money goes.
              </p>
            </div>
          </div>
        </div>
      </main>
      <div className="flex flex-col w-full pb-8 pt-4 px-6 gap-6 bg-gradient-to-t from-background via-background to-transparent z-50">
        <div className="flex w-full flex-row items-center justify-center gap-3">
          <div className="h-2 w-8 rounded-full bg-primary transition-all duration-300"></div>
          <div className="h-2 w-2 rounded-full bg-muted transition-all duration-300"></div>
          <div className="h-2 w-2 rounded-full bg-muted transition-all duration-300"></div>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
          <Button
            asChild
            size="lg"
            className="h-14 text-lg font-bold tracking-wide shadow-[0_0_20px_rgba(19,236,91,0.3)]"
          >
            <Link href="/signup">Create Account</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 text-base font-bold tracking-wide"
          >
            <Link href="/login">Log In</Link>
          </Button>
        </div>
        <div className="h-1 w-full"></div>
      </div>
    </div>
  );
}
