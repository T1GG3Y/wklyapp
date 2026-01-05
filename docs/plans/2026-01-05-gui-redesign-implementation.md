# WKLY GUI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform WKLY from a functional but bland interface into a bold, energetic modern budget app with glassmorphism cards, gradient accents, and delightful animations.

**Architecture:** Update design tokens in globals.css/tailwind.config.ts first, then modify UI components (button, card, input, progress, nav), then update page layouts to use the new design system. Add Framer Motion for animations.

**Tech Stack:** Next.js 15, Tailwind CSS, Radix UI, Framer Motion (new), Satoshi + General Sans fonts (new)

---

## Phase 1: Design Foundation

### Task 1: Add Satoshi and General Sans Fonts

**Files:**
- Modify: `src/app/layout.tsx:1-41`
- Modify: `tailwind.config.ts:12-16`

**Step 1: Update layout.tsx to load new fonts**

Replace the font imports in `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const satoshi = localFont({
  src: [
    { path: '../fonts/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/Satoshi-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/Satoshi-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/Satoshi-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
});

const generalSans = localFont({
  src: [
    { path: '../fonts/GeneralSans-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/GeneralSans-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/GeneralSans-Semibold.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-general-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WKLY',
  description: 'Take control of your finances with WKLY.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${satoshi.variable} ${generalSans.variable} font-body antialiased`}
      >
        <FirebaseClientProvider>{children}</FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
```

**Step 2: Download fonts to src/fonts directory**

Run:
```bash
mkdir -p src/fonts
# Download Satoshi from fontshare.com
curl -L "https://api.fontshare.com/v2/fonts/download/satoshi" -o /tmp/satoshi.zip
unzip /tmp/satoshi.zip -d /tmp/satoshi
cp /tmp/satoshi/Fonts/WEB/fonts/Satoshi-Regular.woff2 src/fonts/
cp /tmp/satoshi/Fonts/WEB/fonts/Satoshi-Medium.woff2 src/fonts/
cp /tmp/satoshi/Fonts/WEB/fonts/Satoshi-Bold.woff2 src/fonts/
cp /tmp/satoshi/Fonts/WEB/fonts/Satoshi-Black.woff2 src/fonts/

# Download General Sans from fontshare.com
curl -L "https://api.fontshare.com/v2/fonts/download/general-sans" -o /tmp/general-sans.zip
unzip /tmp/general-sans.zip -d /tmp/general-sans
cp /tmp/general-sans/Fonts/WEB/fonts/GeneralSans-Regular.woff2 src/fonts/
cp /tmp/general-sans/Fonts/WEB/fonts/GeneralSans-Medium.woff2 src/fonts/
cp /tmp/general-sans/Fonts/WEB/fonts/GeneralSans-Semibold.woff2 src/fonts/
```

**Step 3: Update tailwind.config.ts font families**

```typescript
fontFamily: {
  body: ['var(--font-general-sans)', 'sans-serif'],
  headline: ['var(--font-satoshi)', 'sans-serif'],
  sans: ['var(--font-general-sans)', 'sans-serif'],
},
```

**Step 4: Run dev server to verify fonts load**

Run: `npm run dev`
Expected: App loads with new fonts applied

**Step 5: Commit**

```bash
git add src/fonts src/app/layout.tsx tailwind.config.ts
git commit -m "feat: add Satoshi and General Sans fonts"
```

---

### Task 2: Update Color System and CSS Variables

**Files:**
- Modify: `src/app/globals.css:1-121`

**Step 1: Replace globals.css with new design tokens**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 145 84% 50%;
    --primary-foreground: 0 0% 0%;
    --secondary: 283 85% 63%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 283 85% 63%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 145 84% 50%;
    --radius: 0.75rem;

    /* Gradient colors */
    --gradient-start: 145 84% 50%;
    --gradient-end: 283 85% 63%;

    /* Glass effect */
    --glass-bg: 0 0% 100% / 0.05;
    --glass-border: 0 0% 100% / 0.1;
    --glass-blur: 12px;
  }

  .dark {
    --background: 0 0% 13%;
    --foreground: 0 0% 98%;
    --card: 0 0% 16%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 13%;
    --popover-foreground: 0 0% 98%;
    --primary: 145 84% 50%;
    --primary-foreground: 0 0% 0%;
    --secondary: 283 85% 63%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 20%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 283 85% 63%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 20%;
    --input: 0 0% 18%;
    --ring: 145 84% 50%;

    /* Gradient colors */
    --gradient-start: 145 84% 50%;
    --gradient-end: 283 85% 63%;

    /* Glass effect - tuned for dark mode */
    --glass-bg: 0 0% 100% / 0.05;
    --glass-border: 0 0% 100% / 0.1;
    --glass-blur: 12px;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    min-height: 100vh;
    min-height: -webkit-fill-available;
  }

  .no-scrollbar::-webkit-scrollbar,
  .scrollbar-hide::-webkit-scrollbar,
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar,
  .scrollbar-hide,
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 0.6;
    cursor: pointer;
  }
  .dark input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
}

@layer utilities {
  /* Gradient utilities */
  .gradient-primary {
    background: linear-gradient(135deg, hsl(var(--gradient-start)) 0%, hsl(var(--gradient-end)) 100%);
  }

  .gradient-primary-text {
    background: linear-gradient(135deg, hsl(var(--gradient-start)) 0%, hsl(var(--gradient-end)) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .gradient-border {
    position: relative;
    background: hsl(var(--card));
    border-radius: var(--radius);
  }

  .gradient-border::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 1.5px;
    border-radius: inherit;
    background: linear-gradient(135deg, hsl(var(--gradient-start)) 0%, hsl(var(--gradient-end)) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  /* Glassmorphism */
  .glass {
    background: hsl(var(--glass-bg));
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid hsl(var(--glass-border));
  }

  /* Glow effects */
  .glow-primary {
    box-shadow: 0 0 20px -5px hsl(var(--primary) / 0.5);
  }

  .glow-gradient {
    box-shadow:
      0 0 20px -5px hsl(var(--gradient-start) / 0.4),
      0 0 40px -10px hsl(var(--gradient-end) / 0.3);
  }

  /* Neon chart line glow */
  .neon-glow {
    filter: drop-shadow(0 0 6px hsl(var(--primary) / 0.6));
  }

  /* Progress circles - updated */
  .progress-circle {
    @apply relative rounded-full w-56 h-56 flex items-center justify-center;
  }

  .progress-circle::before {
    content: '';
    @apply absolute rounded-full w-[85%] h-[85%];
    background: hsl(var(--glass-bg));
    backdrop-filter: blur(8px);
  }

  .progress-circle-sm {
    @apply relative rounded-full w-40 h-40 flex items-center justify-center;
  }

  .progress-circle-sm::before {
    content: '';
    @apply absolute rounded-full w-[85%] h-[85%];
    background: hsl(var(--glass-bg));
    backdrop-filter: blur(8px);
  }
}
```

**Step 2: Verify styles apply correctly**

Run: `npm run dev`
Expected: Dark background is #212121, gradient utilities work

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: update color system with gradients and glassmorphism"
```

---

### Task 3: Update Tailwind Config with Animations

**Files:**
- Modify: `tailwind.config.ts:76-98`

**Step 1: Add new keyframes and animations**

Add to the `keyframes` section:

```typescript
keyframes: {
  'accordion-down': {
    from: { height: '0' },
    to: { height: 'var(--radix-accordion-content-height)' },
  },
  'accordion-up': {
    from: { height: 'var(--radix-accordion-content-height)' },
    to: { height: '0' },
  },
  'pulse-glow': {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.7' },
  },
  'scale-in': {
    '0%': { transform: 'scale(0.95)', opacity: '0' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
  'slide-up': {
    '0%': { transform: 'translateY(10px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  'confetti': {
    '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
    '100%': { transform: 'translateY(-100px) rotate(720deg)', opacity: '0' },
  },
  'count-up': {
    '0%': { opacity: '0', transform: 'translateY(10px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
},
animation: {
  'accordion-down': 'accordion-down 0.2s ease-out',
  'accordion-up': 'accordion-up 0.2s ease-out',
  'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
  'scale-in': 'scale-in 0.2s ease-out',
  'slide-up': 'slide-up 0.3s ease-out',
  'confetti': 'confetti 1s ease-out forwards',
  'count-up': 'count-up 0.4s ease-out',
},
```

**Step 2: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: add animation keyframes for micro-interactions"
```

---

## Phase 2: Core Components

### Task 4: Install Framer Motion

**Step 1: Install dependency**

Run: `npm install framer-motion`

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add framer-motion for animations"
```

---

### Task 5: Update Button Component

**Files:**
- Modify: `src/components/ui/button.tsx:1-57`

**Step 1: Replace button.tsx with gradient pill buttons**

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "gradient-primary text-white rounded-full glow-gradient hover:opacity-90",
        destructive: "bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90",
        outline: "gradient-border bg-transparent text-foreground rounded-full hover:bg-muted/50",
        secondary: "bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80",
        ghost: "hover:bg-muted rounded-full hover:text-foreground",
        link: "gradient-primary-text underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Step 2: Verify buttons render correctly**

Run: `npm run dev`
Expected: Primary buttons show gradient, pill shape, glow effect

**Step 3: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat: update button with gradient pill style"
```

---

### Task 6: Update Card Component with Glassmorphism

**Files:**
- Modify: `src/components/ui/card.tsx:1-80`

**Step 1: Replace card.tsx with glassmorphism style**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl glass text-card-foreground",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-xl font-bold font-headline leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-5 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

**Step 2: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat: update card with glassmorphism style"
```

---

### Task 7: Update Input Component

**Files:**
- Modify: `src/components/ui/input.tsx:1-23`

**Step 1: Replace input.tsx with new dark style**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border-0 bg-input px-4 py-3 text-base ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:bg-input/80 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

**Step 2: Commit**

```bash
git add src/components/ui/input.tsx
git commit -m "feat: update input with dark filled style and gradient focus"
```

---

### Task 8: Update Progress Component with Neon Glow

**Files:**
- Modify: `src/components/ui/progress.tsx:1-29`

**Step 1: Replace progress.tsx with neon style**

```tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  glow?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, glow = true, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-3 w-full overflow-hidden rounded-full bg-muted/50",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 gradient-primary transition-all duration-500 ease-out rounded-full",
        glow && "glow-gradient",
        indicatorClassName
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```

**Step 2: Commit**

```bash
git add src/components/ui/progress.tsx
git commit -m "feat: update progress bar with gradient fill and neon glow"
```

---

## Phase 3: Navigation

### Task 9: Update Bottom Navigation to Floating Style

**Files:**
- Modify: `src/components/BottomNav.tsx:1-68`

**Step 1: Replace BottomNav.tsx with floating gradient style**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  User,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/budget", icon: Wallet, label: "Budget" },
  { href: "/reports", icon: PieChart, label: "Reports" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-30">
      <div className="glass rounded-3xl px-2 py-2 flex justify-around items-center max-w-md mx-auto">
        {navItems.slice(0, 2).map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-200",
                isActive
                  ? "gradient-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {isActive && <span className="text-[10px] font-medium">{label}</span>}
            </Link>
          );
        })}

        <Link
          href="/transaction/new"
          className="gradient-primary rounded-full p-3 glow-gradient hover:opacity-90 transition-all duration-200 active:scale-95 -my-4"
        >
          <Plus className="h-6 w-6 text-white" />
        </Link>

        {navItems.slice(2).map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-200",
                isActive
                  ? "gradient-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {isActive && <span className="text-[10px] font-medium">{label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Step 2: Verify nav bar looks correct**

Run: `npm run dev`
Expected: Floating glassmorphism nav bar with gradient active states, centered "+" button

**Step 3: Commit**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat: update bottom nav to floating glassmorphism style"
```

---

## Phase 4: Page Layouts

### Task 10: Update Dashboard Page

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Update header and main content styling**

Update the header section (around line 211):

```tsx
<header className="px-5 py-4 flex items-center justify-between sticky top-0 glass z-20">
  <h1 className="text-xl font-bold font-headline tracking-tight text-foreground">
    Dashboard
  </h1>
</header>
```

**Step 2: Update the main container and cards**

Update main section (around line 216):

```tsx
<main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-28 space-y-5 pt-4">
```

**Step 3: Update the progress circles card (around line 217)**

```tsx
<div className="glass rounded-3xl p-6 flex items-start justify-around relative">
```

**Step 4: Update the ProgressCircle component styling (around line 68-94)**

Replace the ProgressCircle component:

```tsx
const ProgressCircle = ({ title, remaining, total, progress, colorClass, rollover }: { title: string, remaining: number, total: number, progress: number, colorClass: string, rollover?: number }) => (
    <div className="flex flex-col items-center gap-3">
        <div
          className="progress-circle-sm neon-glow"
          style={{
            background: `conic-gradient(${colorClass} ${progress}%, hsl(var(--muted) / 0.3) 0deg)`,
          }}
        >
            <div className="relative z-10 text-center">
                <p className={cn("text-3xl font-black tracking-tight font-headline", remaining >= 0 ? 'text-foreground' : 'text-red-500')}>
                    ${remaining.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">of ${total.toFixed(0)}</p>
            </div>
        </div>
        <div className="flex items-center gap-1">
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          {rollover !== undefined && rollover !== 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Includes ${rollover.toFixed(2)} from last week.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
    </div>
);
```

**Step 5: Update Recent Activity section (around line 236)**

```tsx
<div className="glass rounded-3xl p-5">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
        <Receipt className="text-white h-5 w-5" />
      </div>
      <h2 className="text-lg font-bold font-headline text-foreground">
        Recent Activity
      </h2>
    </div>
  </div>
  <div className="flex flex-col items-center text-center mb-6">
    <Button asChild className="w-full" size="lg">
      <Link href="/transaction/new">Add a transaction</Link>
    </Button>
  </div>
```

**Step 6: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: update dashboard with glassmorphism cards and improved styling"
```

---

### Task 11: Update Budget Page

**Files:**
- Modify: `src/app/budget/page.tsx`

**Step 1: Update header (around line 206-212)**

```tsx
<header className="px-5 py-4 flex items-center justify-center sticky top-0 glass z-20">
  <h1 className="text-xl font-bold font-headline tracking-tight text-foreground">
    My Budget
  </h1>
</header>
```

**Step 2: Update main container (around line 213)**

```tsx
<main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-28 space-y-3 pt-4">
```

**Step 3: Update AccordionItem styling (around line 217)**

Replace `className='bg-card rounded-lg border px-4 shadow-sm'` with:

```tsx
className='glass rounded-2xl px-4'
```

Apply this to all AccordionItem components (lines 217, 245, 273, 301, 329).

**Step 4: Update icon containers in accordion triggers**

Replace `className='text-primary size-5'` on the icons with gradient background:

```tsx
<div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
  <Wallet className='text-white size-4'/>
</div>
```

**Step 5: Commit**

```bash
git add src/app/budget/page.tsx
git commit -m "feat: update budget page with glassmorphism style"
```

---

### Task 12: Update Accordion Component Border Styling

**Files:**
- Modify: `src/components/ui/accordion.tsx`

**Step 1: Remove default border from AccordionItem**

Find the AccordionItem component and update its className to remove `border-b`:

```tsx
const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("", className)}
    {...props}
  />
))
```

**Step 2: Commit**

```bash
git add src/components/ui/accordion.tsx
git commit -m "feat: remove default border from accordion for glassmorphism cards"
```

---

## Phase 5: Celebration Animations

### Task 13: Create Confetti Component

**Files:**
- Create: `src/components/ui/confetti.tsx`

**Step 1: Create the confetti animation component**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/components/ui/confetti.tsx
git commit -m "feat: add confetti celebration component"
```

---

### Task 14: Create Success Toast with Animation

**Files:**
- Modify: `src/components/ui/toast.tsx`

**Step 1: Add success variant with gradient styling**

Find the `toastVariants` cva definition and add a success variant:

```tsx
success: "gradient-primary text-white glow-gradient",
```

**Step 2: Commit**

```bash
git add src/components/ui/toast.tsx
git commit -m "feat: add success toast variant with gradient style"
```

---

## Phase 6: Final Polish

### Task 15: Update Transaction Form Pages

**Files:**
- Modify: `src/app/transaction/new/page.tsx`
- Modify: `src/app/transaction/edit/[id]/page.tsx`

**Step 1: Update headers to glassmorphism style**

In both files, update the header:

```tsx
<header className="px-5 py-4 flex items-center justify-between sticky top-0 glass z-20">
```

**Step 2: Update main container padding**

```tsx
<main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-28 pt-4">
```

**Step 3: Commit**

```bash
git add src/app/transaction/new/page.tsx src/app/transaction/edit/[id]/page.tsx
git commit -m "feat: update transaction pages with new styling"
```

---

### Task 16: Update Profile and Help Pages

**Files:**
- Modify: `src/app/profile/page.tsx`
- Modify: `src/app/help/page.tsx`

**Step 1: Update headers to glassmorphism style**

Same pattern as above - update header class to `glass` and adjust padding.

**Step 2: Update card backgrounds**

Replace `bg-card` with `glass` class on card containers.

**Step 3: Commit**

```bash
git add src/app/profile/page.tsx src/app/help/page.tsx
git commit -m "feat: update profile and help pages with new styling"
```

---

### Task 17: Update Reports Page

**Files:**
- Modify: `src/app/reports/page.tsx`
- Modify: `src/app/reports/[id]/page.tsx`

**Step 1: Update headers and cards to match new design**

Same pattern - glassmorphism headers and cards.

**Step 2: Commit**

```bash
git add src/app/reports/page.tsx src/app/reports/[id]/page.tsx
git commit -m "feat: update reports pages with new styling"
```

---

### Task 18: Final Build Verification

**Step 1: Run the build**

Run: `npm run build`
Expected: Build completes with no errors

**Step 2: Run type check**

Run: `npm run typecheck`
Expected: No TypeScript errors

**Step 3: Test locally**

Run: `npm run dev`
Expected: All pages render correctly with new design

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: final cleanup and build verification"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-3 | Foundation (fonts, colors, animations) |
| 2 | 4-8 | Core components (button, card, input, progress) |
| 3 | 9 | Navigation (floating bottom nav) |
| 4 | 10-12 | Page layouts (dashboard, budget, accordion) |
| 5 | 13-14 | Celebration animations (confetti, toast) |
| 6 | 15-18 | Final polish (remaining pages, build verification) |

Total: 18 tasks across 6 phases
