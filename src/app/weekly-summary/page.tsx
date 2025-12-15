import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Signal, Wifi, BatteryFull } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function WeeklySummaryScreen() {
  const summaryImage = PlaceHolderImages.find(
    (img) => img.id === "weekly-summary"
  );
  return (
    <div className="bg-background font-sans antialiased h-screen flex justify-center items-center overflow-hidden">
      <div className="w-full h-full max-w-md bg-card relative flex flex-col shadow-2xl overflow-y-auto">
        <div className="absolute top-0 w-full flex justify-between items-center px-6 pt-5 pb-2 z-20 text-foreground">
          <span className="text-sm font-semibold">9:41</span>
          <div className="flex items-center space-x-2">
            <Signal size={16} />
            <Wifi size={16} />
            <BatteryFull size={16} />
          </div>
        </div>
        <div className="bg-blue-900/40 pt-20 pb-16 px-6 flex flex-col items-center justify-center relative transition-colors duration-300">
          {summaryImage && (
            <div className="relative w-full max-w-xs aspect-[4/3] flex items-end justify-center">
              <Image
                alt={summaryImage.description}
                src={summaryImage.imageUrl}
                width={400}
                height={300}
                className="object-contain w-full h-full drop-shadow-md z-10"
                data-ai-hint={summaryImage.imageHint}
              />
            </div>
          )}
        </div>
        <div
          className="flex-1 bg-card px-6 pt-8 pb-8 flex flex-col justify-between z-10 shadow-soft transition-colors duration-300"
          style={{
            borderTopLeftRadius: "2rem",
            borderTopRightRadius: "2rem",
            marginTop: "-2rem",
          }}
        >
          <div className="flex flex-col items-center">
            <h2 className="text-muted-foreground font-medium text-lg mb-2">
              Nice work!
            </h2>
            <h1 className="text-2xl font-bold font-headline text-center text-foreground mb-8 leading-tight">
              Your weekly spending
              <br />
              limit is{" "}
              <span className="text-primary">$448.87</span>
            </h1>
            <div className="w-full space-y-3 mb-6">
              <div className="flex justify-between items-center text-base font-bold">
                <span className="text-muted-foreground">
                  Weekly spending limit
                </span>
                <span className="text-primary">$448.87</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between w-full mt-8">
            <Button variant="link" asChild>
              <Link href="/setup/savings">Back</Link>
            </Button>
            <Button asChild className="py-3 px-10 rounded-full shadow-lg">
              <Link href="/dashboard">Continue</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
