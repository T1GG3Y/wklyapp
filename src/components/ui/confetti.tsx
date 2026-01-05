"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

const colors = [
  "hsl(145, 84%, 50%)", // emerald
  "hsl(283, 85%, 63%)", // purple
  "hsl(145, 84%, 70%)", // light emerald
  "hsl(283, 85%, 80%)", // light purple
];

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    if (trigger) {
      setParticles(Array.from({ length: 12 }, (_, i) => i));
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {particles.map((i) => (
        <motion.div
          key={i}
          className="fixed pointer-events-none z-50"
          initial={{
            opacity: 1,
            x: "50vw",
            y: "40vh",
            scale: 1,
          }}
          animate={{
            opacity: 0,
            x: `${50 + (Math.random() - 0.5) * 60}vw`,
            y: `${40 - Math.random() * 40}vh`,
            scale: 0,
            rotate: Math.random() * 720,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.8 + Math.random() * 0.4,
            ease: "easeOut",
          }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: colors[i % colors.length],
              boxShadow: `0 0 6px ${colors[i % colors.length]}`,
            }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
