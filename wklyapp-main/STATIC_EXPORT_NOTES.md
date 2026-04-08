# Static Export Compatibility Notes

This app is configured for static export (`output: 'export'` in `next.config.ts`) to work with Capacitor. This means:

## ✅ What Works

- All client-side React components
- Firebase client SDK (Auth, Firestore)
- Client-side routing
- Static pages and components
- All UI interactions

## ⚠️ What Doesn't Work

### Server Actions

The app contains server actions in `src/ai/flows/` that use the `'use server'` directive:
- `ai-powered-budget-suggestions.ts`
- `intelligent-budget-alerts.ts`
- `summarize-weekly-data.ts`

These will **not work** with static export. If you need these features in the mobile app, you have a few options:

1. **Remove/Disable**: Comment out or remove calls to these functions
2. **Refactor to Client-Side**: Move the logic to client-side code
3. **Use API Routes**: Create a separate backend API and call it from the client
4. **Use Firebase Functions**: Implement the AI logic in Firebase Cloud Functions

### API Routes

Next.js API routes (`/app/api/`) are not supported with static export. If you have any API routes, they need to be:
- Removed
- Moved to a separate backend
- Replaced with Firebase Functions or another backend service

## Current Status

The app should work fine for the core functionality (authentication, data storage, UI) since it primarily uses Firebase client SDK. The AI features may need to be addressed if they're critical to the app.

## Testing

After building with `npm run build`, test the static export locally:

```bash
npm run build
npx serve out
```

Visit `http://localhost:3000` and test all features to ensure everything works as expected.

