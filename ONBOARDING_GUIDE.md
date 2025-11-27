# ScaleX Onboarding System

## Overview

The onboarding system displays a step-by-step modal when users connect their wallet for the first time. It guides them through three key steps:

1. **Deposit Assets** - Initial deposit to unlock trading
2. **Trade & Earn** - Execute trades and earn rewards
3. **Borrow & Manage Risk** - Advanced features with stop-loss limits

## Components

### `OnboardingModal.tsx`
Main modal component with GSAP animations:
- Backdrop fade-in with blur effect
- Modal scale-in with bounce easing
- Progress bar animation
- Step transitions with smooth animations
- Navigation buttons (Back/Next/Got It)
- Three-step progress indicators

**Features:**
- Responsive design
- Smooth animations between steps
- Click-outside to close
- Orange gradient theme matching ScaleX branding

### `useOnboarding.ts`
Custom hook managing onboarding state:
- `isOnboardingOpen` - Modal visibility
- `showOnboarding()` - Show modal if user hasn't seen it
- `completeOnboarding()` - Mark as completed and close
- `hasSeenOnboarding` - Check if user has completed onboarding
- `resetOnboarding()` - Reset for testing (removes localStorage)

**Storage:**
- Uses `localStorage` with key `scalex_onboarding_completed`
- Persists across sessions

### `ProvidersWithOnboarding.tsx`
Wrapper component that:
- Wraps the Privy provider setup
- Detects wallet connection via Privy
- Automatically shows onboarding on first wallet connection
- Handles onboarding completion

## Integration

The onboarding is automatically integrated into your app:

1. Layout imports `ProvidersWithOnboarding` instead of `Providers`
2. `OnboardingHandler` component listens for wallet connections
3. Modal shows automatically when `user.wallet.address` becomes available

## How It Works

**Trigger Flow:**
```
User visits app
  ↓
LoadingScreen displays (2 seconds)
  ↓
User connects wallet via Privy
  ↓
Privy detects wallet connection
  ↓
useOnboarding hook checks localStorage
  ↓
If not seen before → Show OnboardingModal
  ↓
User completes steps
  ↓
completeOnboarding() stores in localStorage
  ↓
Won't show again
```

## Testing

For development/testing, use the `OnboardingTestButton` component:

```tsx
// Add to a page temporarily
import OnboardingTestButton from '@/components/OnboardingTestButton';

// Then render it
<OnboardingTestButton />
```

**What it does:**
- Resets the onboarding state
- Immediately shows the modal
- Useful for testing without reconnecting wallet repeatedly

**Remove before production:**
- Simply don't import/render the button
- It's a development-only helper

## Customization

### Edit Steps
Modify `STEPS` array in `OnboardingModal.tsx`:
```tsx
const STEPS = [
  {
    id: 1,
    title: 'Your Title',
    description: 'Your description',
    icon: '🎯', // Emoji icon
    color: 'from-blue-500 to-blue-600', // Tailwind gradient
  },
  // Add more steps...
];
```

### Change Colors
- Update icon gradients: `from-blue-500 to-blue-600`
- Update progress bar: Change `from-orange-500 to-orange-600`
- Update button: Modify gradient class

### Adjust Animations
In `OnboardingModal.tsx`, modify GSAP timelines:

```tsx
// Faster modal entrance
tl.from(modalRef.current, {
  scale: 0.8,
  opacity: 0,
  duration: 0.2, // Reduce from 0.4
  ease: 'back.out',
});

// Slower step transitions
// In second useEffect, change duration values
```

### Timing

- **Modal entrance**: 0.4 seconds
- **Progress bar animation**: 0.5 seconds each
- **Content fade in**: 0.4 seconds
- **Step transition**: 0.3s out + 0.4s in
- **Hold time**: 2 seconds before auto-fade on LoadingScreen

## localStorage

**Key:** `scalex_onboarding_completed`  
**Value:** `'true'` when completed

To manually reset in browser console:
```js
localStorage.removeItem('scalex_onboarding_completed')
```

## Files

- `components/OnboardingModal.tsx` - Main modal UI
- `hooks/useOnboarding.ts` - State management
- `providers/ProvidersWithOnboarding.tsx` - Integration with Privy
- `components/OnboardingTestButton.tsx` - Development helper
- `app/layout.tsx` - Uses ProvidersWithOnboarding

## Browser Support

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Performance

- Zero layout shift (fixed positioning)
- Uses GSAP for GPU-accelerated animations
- localStorage lookups are instant
- No additional API calls

## Accessibility

- Backdrop blur and dark overlay for visual focus
- Clear typography hierarchy
- Large touch targets for buttons
- Can close with X button or backdrop click
- Keyboard navigation ready (Back/Next buttons)

## Future Enhancements

Possible additions:
- Keyboard navigation (Arrow keys)
- Skip option on step 1
- Analytics tracking for completion rate
- Conditional steps based on user type
- Language localization
- Video/GIF demonstrations per step
