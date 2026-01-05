# WKLY GUI Redesign

## Overview

A complete visual redesign of WKLY targeting 20-40 year olds. The goal is to transform a functional but bland interface into a bold, energetic, modern budget app that's easy to use. All existing functionality remains unchanged.

**Target Audience**: 20-40 year olds who want a modern, engaging budget app
**Design Direction**: Bold & energetic with personality
**Key Constraint**: Preserve all existing functionality

---

## Visual Foundation

### Color System

**Signature Gradient**
Emerald to purple: `#13EC5B` → `#BE52F2`

Used on:
- Primary buttons
- Active navigation states
- Progress bars and goal trackers
- Hero sections and key metrics

**Base Palette**

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#212121` | Main background |
| `--bg-elevated` | `#2A2A2A` | Elevated surfaces |
| `--bg-card` | `#333333` | Card backgrounds (before glass effect) |
| `--glass-bg` | `rgba(255,255,255,0.05)` | Glassmorphism fill |
| `--glass-border` | `rgba(255,255,255,0.1)` | Glass card borders |
| `--text-primary` | `#FFFFFF` | Primary text |
| `--text-secondary` | `#A0A0A0` | Secondary/muted text |
| `--gradient-start` | `#13EC5B` | Emerald green |
| `--gradient-end` | `#BE52F2` | Electric purple |

**Semantic Colors**
Keep standard success/warning/error colors but tint slightly toward the palette for cohesion.

### Typography

**Font Pairing**
- **Headlines**: Satoshi (Bold/Black)
- **Body**: General Sans (Regular/Medium)

**Type Scale**

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Hero numbers (balance) | Satoshi | 40-48px | Black |
| Section headlines | Satoshi | 24-28px | Bold |
| Card titles | Satoshi | 18-20px | Bold |
| Body text | General Sans | 16px | Regular |
| Labels | General Sans | 14px | Medium |
| Captions | General Sans | 12px | Regular |

### Spacing

- Screen edge padding: 16px minimum
- Between major sections: 24-32px
- Card internal padding: 20-24px
- Generous line height throughout (1.5 for body text)

---

## Core Components

### Buttons

**Primary**
- Shape: Pill (fully rounded corners)
- Fill: Emerald-to-purple gradient
- Text: White, General Sans Medium
- Effect: Subtle glow on hover/press

**Secondary**
- Shape: Pill
- Fill: Transparent
- Border: 1-2px gradient
- Text: White

**Ghost**
- Text-only
- Gradient text color
- For tertiary actions

### Cards (Glassmorphism)

```css
.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
}
```

- No harsh shadows - blur and layering create natural depth
- Border radius: 20-24px

### Inputs

- Background: `#2A2A2A` (dark filled)
- Border radius: 12px
- Focus state: Gradient border appears with subtle glow
- Labels: Float above in General Sans Medium

### Navigation Bar

- Style: Floating (16px margin from bottom and sides)
- Background: Frosted glass matching cards
- Border radius: 24px (pill-like)
- Active tab: Icon + label with gradient background pill
- Inactive tabs: Muted gray icons only (no labels)

---

## Screen Layouts

### Home/Dashboard

```
┌─────────────────────────────────┐
│  Hey [Name]              [Avatar]│
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ ══════════════════════    │  │  ← Gradient accent line
│  │                           │  │
│  │     $2,450.00             │  │  ← Balance (Satoshi Black, 48px)
│  │     Total Balance         │  │
│  │                           │  │
│  └───────────────────────────┘  │  ← Glassmorphism card
│                                 │
│  ┌───────────────────────────┐  │
│  │ This Week                 │  │
│  │ $340 / $500        ◔ 68%  │  │  ← Neon progress arc
│  └───────────────────────────┘  │
│                                 │
│  [+ Add Expense] [+ Add Income] │  ← Gradient pill buttons
│                                 │
│  Recent Transactions            │
│  ├─ Coffee Shop      -$4.50    │
│  ├─ Grocery Store   -$67.20    │
│  └─ See All →                  │
│                                 │
├─────────────────────────────────┤
│     ◉ Home  Transactions  ...   │  ← Floating nav bar
└─────────────────────────────────┘
```

### Transactions Screen

- Sticky search/filter bar at top (glassmorphism)
- Transactions grouped by day with date headers
- Each row: Category icon, name, amount
- Floating "+" button with gradient fill

### Budget Screen

- Category cards in vertical stack
- Each card: Icon, category name, spent/total, neon progress bar
- Progress bar glow intensifies approaching limit (visual warning)
- Tap to expand details

### Goals Screen

- Large goal cards (one visible at a time)
- Swipeable carousel or vertical scroll
- Circular progress indicator with gradient stroke and glow
- Celebration triggers at 25%, 50%, 75%, 100%

---

## Animation & Motion

### Micro-interactions

| Element | Animation | Duration |
|---------|-----------|----------|
| Button press | Scale to 0.97, glow pulse | 150ms |
| Card touch | Subtle lift (shadow increase) | 200ms |
| Page transition | Fade + slide | 250ms |
| Tab switch | Active pill slides between tabs | 200ms |

### Delightful Celebrations

**Transaction Added**
- Quick checkmark animation
- Small confetti burst (2-3 particles)

**Under Budget (Week Complete)**
- Progress bar completes with glow pulse
- "Nice work!" toast with gradient accent

**Goal Milestone (25/50/75%)**
- Circular progress fills with glowing trail
- Particles burst outward
- Haptic feedback

**Goal Completed (100%)**
- Full celebration
- Larger confetti burst
- Progress ring explodes into particles
- Celebratory message with gradient text

### Data Visualization

- Charts animate in on screen entry
- Lines draw themselves, bars grow upward
- Numbers count up to final values
- Neon glow on chart lines subtly pulses

### Timing Principles

- Celebrations: 1-2 seconds max
- Never block user - dismissible immediately
- Curves: ease-out for snappy feel
- Duration: 200-400ms for most animations

---

## Chart Styling (Neon Line Style)

```css
.chart-line {
  stroke: url(#gradient);
  stroke-width: 2px;
  filter: drop-shadow(0 0 6px rgba(19, 236, 91, 0.6));
}

.chart-area-fill {
  fill: url(#gradient);
  opacity: 0.1;
}
```

- Thin glowing lines on dark backgrounds
- Futuristic dashboard aesthetic
- Grid lines: Very subtle (`rgba(255,255,255,0.05)`)
- Axis labels: `--text-secondary` color

---

## Implementation Notes

### CSS Custom Properties

Define all design tokens as CSS custom properties for consistency:

```css
:root {
  --gradient: linear-gradient(135deg, #13EC5B 0%, #BE52F2 100%);
  --bg-primary: #212121;
  --bg-elevated: #2A2A2A;
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-blur: 12px;
  --radius-card: 20px;
  --radius-button: 9999px;
  --radius-input: 12px;
}
```

### Font Loading

Load Satoshi and General Sans from Fontshare (free) or self-host:
- Satoshi: https://www.fontshare.com/fonts/satoshi
- General Sans: https://www.fontshare.com/fonts/general-sans

### Animation Library

Consider Framer Motion for React animations - handles the celebrations and micro-interactions well.

### Accessibility

- Maintain WCAG AA contrast ratios (gradient text on dark bg needs testing)
- Animations respect `prefers-reduced-motion`
- Focus states visible with gradient ring

---

## Summary

| Aspect | Choice |
|--------|--------|
| Vibe | Bold & energetic |
| Colors | Emerald-to-purple gradient signature |
| Cards | Glassmorphism |
| Navigation | Floating bottom bar with gradient active state |
| Typography | Satoshi + General Sans |
| Data Viz | Neon line style |
| Density | Spacious and breathable |
| Animation | Delightful moments at key milestones |
