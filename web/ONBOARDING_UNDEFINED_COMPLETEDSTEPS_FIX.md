# Onboarding CompletedSteps Undefined Error Fix

## Problem
Runtime error: "Cannot read properties of undefined (reading 'length')" in `calculateOnboardingProgress` function at line 234 of `src/lib/onboarding-utils.ts`.

## Root Cause
The onboarding API was returning a simplified response object with only `needsOnboarding` and `isComplete` properties, but the React hook was expecting a full `OnboardingState` object with a `completedSteps` array. When the hook tried to call utility functions that access `state.completedSteps.length`, it failed because `completedSteps` was undefined.

## Solution Applied

### 1. Fixed API Response Structure
Updated `/api/onboarding` route to return a proper `OnboardingState` object:
- Added proper `completedSteps` array
- Added all required properties (`isNewUser`, `currentStep`, `progress`, etc.)
- Ensured both success and error cases return valid `OnboardingState` objects

### 2. Added Multiple Safety Layers
- **Utility Functions**: Already had `?.length || 0` null safety checks
- **Hook State Setting**: Added `completedSteps: onboardingState.completedSteps || []` 
- **Progress Calculation**: Added `Array.isArray()` check before passing to utility functions

### 3. Defensive Programming
- Multiple fallback mechanisms ensure `completedSteps` is always an array
- Graceful degradation if API returns unexpected data structure
- Consistent error handling across all code paths

## Files Modified
1. `web/src/app/api/onboarding/route.ts` - Fixed API response structure
2. `web/src/hooks/use-onboarding.ts` - Added additional safety checks
3. `web/src/lib/onboarding-utils.ts` - Already had null safety (no changes needed)

## Result
- ✅ No more runtime errors when accessing `completedSteps.length`
- ✅ Proper onboarding state management
- ✅ Graceful fallbacks for edge cases
- ✅ Type-safe API responses

The error should now be resolved and the dashboard should load without crashing.