# FlightCard Responsive Design

## Overview
The FlightCard component now has a fully responsive design that adapts from desktop to mobile layouts. **IMPORTANT: The flight body (departure/arrival times) maintains a horizontal layout across ALL screen sizes with reduced font sizes on mobile.**

## Key Design Principle
⭐ **The flight times section (Body) NEVER stacks vertically** - it always maintains a 3-column horizontal layout (Departure | Duration | Arrival) even on the smallest mobile screens.

## Mobile Layout (<1024px)
```
┌─────────────────────────────────────┐
│       FlightCard Container          │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │  1. Header (Airline Info)     │  │
│  │     Qatar Airways • QR641     │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │  2. Body - ALWAYS HORIZONTAL  │  │
│  │                               │  │
│  │  DAC      21h 15m      JFK    │  │
│  │  16:45  ────✈────  14:00      │  │
│  │  Dhaka   1 stop    New York   │  │
│  │                               │  │
│  │  (Smaller fonts & gaps)       │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │  3. Sidebar (Fare Section)    │  │
│  │     Economy Classic ▼         │  │
│  │     • Baggage: 20kg           │  │
│  │     • Booking Class: O        │  │
│  │     BDT 98,051                │  │
│  │     (No button on mobile)     │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │  4. Footer (Tabbar)           │  │
│  │     🛡️ Refundable             │  │
│  │     [Details] [Fare] [Bag]    │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  │   5. [Select Button]          │  │
└─────────────────────────────────────┘
```

## Component-by-Component Breakdown

### Component Rendering Order

**Mobile (<1024px)**:
1. FlightCardHeader
2. FlightCardBody (horizontal layout)
3. FlightCardSidebar (without select button)
4. FlightCardFooter (tabbar)
5. Select Button (standalone)

**Desktop (≥1024px)**:
- Left column: Header → Body → Footer
- Right sidebar: Sidebar with select button

### 1. FlightCardHeader
**File**: `FlightCardHeader.tsx`

**Responsive Changes**:
- Logo: 32px (mobile) → 36px (desktop)
- Airline name: `text-[10px] sm:text-xs`
- Flight numbers: `text-[8px] sm:text-[10px]`
- Aircraft: `text-[10px] sm:text-xs`
- Padding: `px-2 sm:px-4 py-1.5 sm:py-2`

### 2. FlightCardBody ⭐ CRITICAL
**File**: `FlightCardBody.tsx`

**ALWAYS uses 3-column grid**:
```tsx
grid-cols-[1fr_auto_1fr]  // No breakpoint prefix!
```

**Mobile Optimizations**:
- Container padding: `px-2 sm:px-4`
- Column gaps: `gap-2 sm:gap-4 lg:gap-6` (8px → 16px → 24px)
- Flight times: `text-2xl sm:text-3xl lg:text-4xl` (24px → 30px → 36px)
- Airport codes: `text-[10px] sm:text-sm` (10px → 14px)
- City names: `text-[10px] sm:text-sm` (10px → 14px)
- Dates/terminals: `text-[9px] sm:text-xs` (9px → 12px)
- Plane icon: `w-3.5 h-3.5 sm:w-5 sm:h-5` (14px → 20px)
- Duration line: `max-w-[80px] sm:max-w-[128px]`

**Result**: On mobile, times are clearly readable at 24px while everything fits horizontally.

### 3. FlightCardFooter
**File**: `FlightCardFooter.tsx`

**Responsive Changes**:
- Layout: `flex-col sm:flex-row` (stacks on mobile)
- Min height: `min-h-[48px] sm:min-h-[52px]`
- Padding: `px-2 sm:px-4 py-2 sm:py-3`
- Tab text: `text-[10px] sm:text-xs`
- Tab padding: `px-2 sm:px-3 py-1.5 sm:py-2`
- Icon size: `w-3 h-3 sm:w-3.5 sm:h-3.5`

### 4. FlightCardSidebar
**File**: `FlightCardSidebar.tsx`

**Responsive Behavior**:
- **Mobile**: Appears between Body and Footer, WITHOUT select button
- **Desktop**: Fixed 300px width on right side, WITH select button

**Props**:
- `showSelectButton`: Controls whether the button is rendered
- Mobile version: `showSelectButton={false}`
- Desktop version: `showSelectButton={true}`

**Responsive Changes**:
- Width: `w-full lg:w-[300px]`
- Border: `border-t lg:border-t-0 lg:border-l` (top → left)
- Price: `text-xl sm:text-2xl` (20px → 24px)
- Inclusions text: `text-xs sm:text-sm`
- Button height: `h-[48px] sm:h-[52px]` (when shown)
- Button text: `text-sm sm:text-base`

### 5. Select Button (Mobile Standalone)
**Location**: After FlightCardFooter on mobile only

**Styling**:
- Full width button
- Height: `h-[48px] sm:h-[52px]`
- Only visible on mobile: `lg:hidden`
- Same styling as desktop button for consistency

### 6. Main Container
**File**: `index.tsx`

**Layout Switch**:
```tsx
flex flex-col lg:flex-row
```

**Mobile Layout Strategy**:
- Main container stacks vertically
- Sidebar rendered twice with different props:
  - First render (mobile only): Between Body and Footer, no button
  - Second render (desktop only): Right side with button
- Select button appears standalone after Footer on mobile

**Desktop Layout**:
- Left column: Header → Body → Footer (with mt-auto on Footer)
- Right sidebar: Full height with select button at bottom

## Font Size Reference

### Mobile (< 640px)
| Element | Size | Pixels |
|---------|------|--------|
| Flight times | text-2xl | 24px |
| Price | text-xl | 20px |
| Airport codes | text-[10px] | 10px |
| City names | text-[10px] | 10px |
| Tabs | text-[10px] | 10px |
| Dates | text-[9px] | 9px |

### Desktop (≥ 1024px)
| Element | Size | Pixels |
|---------|------|--------|
| Flight times | text-4xl | 36px |
| Price | text-2xl | 24px |
| Airport codes | text-sm | 14px |
| City names | text-sm | 14px |
| Tabs | text-xs | 12px |
| Dates | text-xs | 12px |

## Spacing Reference

### Gaps (between grid columns)
- Mobile: `gap-2` (8px)
- Tablet: `gap-4` (16px)
- Desktop: `gap-6` (24px)

### Padding
- Mobile: `px-2` (8px) / `py-1.5` (6px)
- Desktop: `px-4` (16px) / `py-2` (8px)

## Why This Design Works

### ✅ Optimal Mobile Order
The specific order on mobile provides the best UX:
1. **Header** - Immediate airline identification
2. **Body** - Core flight times and route (always horizontal)
3. **Fare Section** - Pricing and inclusions visible before committing
4. **Tabbar** - Additional details accessible if needed
5. **Select Button** - Clear call-to-action at the end

This flow lets users scan flight details → see price → get more info → make decision.

### ✅ Horizontal Body Benefits
1. **Consistent Mental Model**: Users scan left-to-right at all sizes
2. **Quick Comparison**: Easy to compare multiple flights
3. **No Breaking**: Flight details always grouped together
4. **Natural Flow**: Departure → Duration → Arrival reads naturally

### ✅ Proportional Scaling
All elements scale by ~60-80%:
- Critical info (times, price) stays large enough
- Less critical info (dates, terminals) can be smaller
- Touch targets remain adequate (48px min)

### ✅ Mobile-First Performance
- Base styles are compact
- Desktop styles add via breakpoints
- Minimal CSS overhead

## Testing Checklist

### Mobile (< 640px)
- [x] Body maintains horizontal 3-column layout
- [x] Flight times readable at 2xl (24px)
- [x] No horizontal scrolling required
- [x] All text legible without zooming
- [x] Buttons easily tappable (48px height)
- [x] Tabs wrap appropriately
- [x] Select button full width

### Tablet (640px - 1024px)
- [x] Body uses medium times (3xl/30px)
- [x] Comfortable spacing between elements
- [x] Sidebar stacks below main content
- [x] Tabs display in rows

### Desktop (≥ 1024px)
- [x] Body uses large times (4xl/36px)
- [x] Sidebar appears on right
- [x] Generous spacing for readability
- [x] All hover states work
- [x] Layout balanced and aesthetic

## Implementation Notes

### Critical Implementation Details

**Dual Sidebar Rendering**:
```tsx
{/* Mobile: Sidebar without button (between Body and Footer) */}
<div className="lg:hidden">
  <FlightCardSidebar showSelectButton={false} />
</div>

{/* Desktop: Sidebar with button (right side) */}
<div className="hidden lg:flex">
  <FlightCardSidebar showSelectButton={true} onSelect={handleSelect} />
</div>
```

**Mobile Select Button**:
```tsx
{/* Standalone button after Footer on mobile */}
<div className="lg:hidden">
  <button onClick={handleSelect}>Select</button>
</div>
```

### Critical Classes
```tsx
// Body - ALWAYS horizontal
grid-cols-[1fr_auto_1fr]

// Responsive font sizes
text-2xl sm:text-3xl lg:text-4xl

// Responsive spacing
gap-2 sm:gap-4 lg:gap-6
px-2 sm:px-4
```

### Breakpoints Used
- `sm:` 640px - Tablet start
- `lg:` 1024px - Desktop start

### Dark Mode
All responsive changes maintain full dark mode support using `dark:` prefix.

### Accessibility
- Touch targets: Minimum 48px on mobile
- Color contrast: Maintained at all sizes
- Text scaling: All units relative
- Focus indicators: Visible at all sizes
