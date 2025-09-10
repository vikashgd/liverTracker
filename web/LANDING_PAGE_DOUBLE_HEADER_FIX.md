# Landing Page Double Header/Footer Fix

## Issues Fixed

### 1. Hero Image Filename
- **Problem**: Hero section was referencing `/hero-family.jpg` but the actual file is `hero-family.png`
- **Fix**: Updated image source in `hero-section.tsx` to use correct `.png` extension

### 2. Double Header/Footer Issue
- **Problem**: Root layout (`layout.tsx`) includes `EnhancedMedicalHeader` and footer globally, causing double headers/footers on landing page
- **Root Cause**: Landing page has its own `LandingHeader` and `LandingFooter` components, creating duplicates
- **Fix**: Modified landing page to use full viewport overlay that completely overrides the root layout

## Changes Made

### File: `web/src/components/landing/hero-section.tsx`
```diff
- src="/hero-family.jpg"
+ src="/hero-family.png"
```

### File: `web/src/components/landing/landing-page.tsx`
```diff
- <div className="min-h-screen bg-white">
+ <div className="fixed inset-0 bg-white overflow-y-auto z-50">
```

## Technical Solution

The landing page now uses:
- `fixed inset-0`: Full viewport positioning
- `overflow-y-auto`: Allows scrolling within the landing page
- `z-50`: High z-index to ensure it appears above root layout elements
- Complete isolation from root layout header/footer

## Result

✅ Single landing header (no medical dashboard header)
✅ Single landing footer (no root layout footer)
✅ Correct hero image displays (`hero-family.png`)
✅ Clean, professional landing page experience
✅ Proper separation between landing and authenticated app layouts

## Testing

Navigate to the home page (`/`) while logged out to see:
- Clean landing page with single header/footer
- Proper hero image display
- No duplicate navigation elements