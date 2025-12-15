# Image Guidelines for FinanceFlow

This document outlines the key images and icons used in the FinanceFlow application. You can use this as a checklist to create or source your own assets to replace the current placeholders.

## 1. Favicon

A favicon is the small icon that appears in the browser tab. While one has not been generated for this project, it is highly recommended to add one to your `public` directory and link it in `src/app/layout.tsx`.

- **File:** `public/favicon.ico` (or other formats like .png, .svg)
- **Sizes:** 16x16, 32x32, and other sizes for different devices.

## 2. Placeholder Images

The application uses placeholder images for several key screens. These are defined in `src/lib/placeholder-images.json` and sourced from Unsplash. You can replace these URLs with your own hosted images.

### Welcome Screen Image
- **ID in JSON:** `welcome-screen`
- **Location:** `src/app/page.tsx`
- **Description:** This is the main image a new user sees on the landing page. It should be visually engaging and represent financial management.
- **Current Image Hint:** `finance management`

### Start Day Setup Image
- **ID in JSON:** `start-day`
- **Location:** `src/app/setup/start-day/page.tsx`
- **Description:** An image or illustration shown when the user selects the start day of their week.
- **Current Image Hint:** `calendar schedule`

### Weekly Summary Image
- **ID in JSON:** `weekly-summary`
- **Location:** `src/app/weekly-summary/page.tsx`
- **Description:** A celebratory image shown after the user completes the initial setup process.
- **Current Image Hint:** `celebration success`

## 3. Category Icons

The application uses icons from the `lucide-react` library to represent different financial categories. These are used on the following screens:

- `src/app/setup/required-expenses/page.tsx`
- `src/app/setup/discretionary/page.tsx`
- `src/app/setup/loans/page.tsx`
- `src/app/setup/savings/page.tsx`

If you need an icon that is not available in `lucide-react`, you would need to use an inline SVG or import it as a React component.
