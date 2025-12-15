"use client";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Signal,
  Wifi,
  BatteryFull,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StartDayScreen() {
  const startDayImage = PlaceHolderImages.find((img) => img.id === "start-day");
  const [selectedDay, setSelectedDay] = useState("Sun");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-muted min-h-screen flex items-center justify-center font-headline p-4">
      <div className="relative w-full max-w-[375px] h-[812px] bg-primary rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-gray-900 box-border flex flex-col">
        <div className="h-12 w-full flex justify-between items-end px-6 pb-2 text-white z-10">
          <span className="text-sm font-semibold tracking-wide">9:41</span>
          <div className="flex items-center gap-1.5">
            <Signal size={16} />
            <Wifi size={16} />
            <BatteryFull size={16} className="rotate-90" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center relative px-6 pb-12">
          <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute top-1/4 left-0 w-64 h-64 bg-white rounded-full blur-3xl mix-blend-overlay"></div>
          </div>
          {startDayImage && (
            <div className="relative z-0 w-full aspect-square flex items-center justify-center mb-4">
              <Image
                alt={startDayImage.description}
                src={startDayImage.imageUrl}
                width={400}
                height={400}
                className="w-full h-full object-contain drop-shadow-sm scale-110"
                data-ai-hint={startDayImage.imageHint}
              />
            </div>
          )}
        </div>
        <div className="bg-background w-full rounded-t-3xl px-6 pt-8 pb-10 flex flex-col shadow-up relative z-10 transition-colors duration-300">
          <h1 className="text-2xl font-bold text-foreground text-center mb-8 leading-tight">
            Pick a day to start your week
          </h1>
          <div className="flex justify-between items-center gap-1 mb-6">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "flex flex-col items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-lg transition-all",
                  selectedDay === day
                    ? "bg-primary text-primary-foreground shadow-md transform scale-105"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                <span className="text-xs md:text-sm font-bold">{day}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-auto px-2">
            <Button variant="link" asChild>
              <Link href="/">Back</Link>
            </Button>
            <Button
              asChild
              className="px-8 py-3.5 rounded-full font-bold text-base shadow-lg"
            >
              <Link href="/setup/income">Set Start Day</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
