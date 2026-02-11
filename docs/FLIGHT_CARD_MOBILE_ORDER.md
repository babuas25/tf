# FlightCard Mobile Order - Quick Reference

## Mobile Component Order (< 1024px)

```
┌────────────────────────────────────────┐
│                                        │
│  1️⃣  HEADER                            │
│      - Airline logo & name             │
│      - Flight numbers                  │
│      - Aircraft type                   │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  2️⃣  BODY (Always Horizontal!)         │
│      DAC 16:45  ──✈──  JFK 14:00      │
│      - Departure | Duration | Arrival  │
│      - Reduced font sizes on mobile    │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  3️⃣  FARE SECTION (Sidebar)            │
│      - Economy Classic dropdown        │
│      - Baggage allowance              │
│      - Booking class                  │
│      - Meal included                  │
│      - Seats remaining                │
│      - BDT 98,051 (Total Price)       │
│      - NO SELECT BUTTON HERE          │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  4️⃣  VIEW DETAILS BUTTON (Collapsed)   │
│      ┌──────────────────────────────┐ │
│      │  📄 View Details      ▼      │ │
│      └──────────────────────────────┘ │
│                                        │
│  OR (When Expanded)                    │
│      ┌──────────────────────────────┐ │
│      │  Hide Details          ▲     │ │
│      ├──────────────────────────────┤ │
│      │  🛡️ Refundable               │ │
│      │  ✈️  Flight Details           │ │
│      │  💵 Fare Summary              │ │
│      │  🧳 Baggage                   │ │
│      │  📄 Fare Rules                │ │
│      └──────────────────────────────┘ │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  5️⃣  SELECT BUTTON                     │
│      ┌──────────────────────────────┐ │
│      │         Select               │ │
│      └──────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

## Desktop Layout (≥ 1024px)

```
┌──────────────────────────────────┬─────────────────┐
│                                  │                 │
│  LEFT COLUMN                     │  RIGHT SIDEBAR  │
│                                  │                 │
│  ┌────────────────────────────┐  │  ┌───────────┐ │
│  │ 1️⃣ HEADER                   │  │  │ Fare      │ │
│  └────────────────────────────┘  │  │ Selector  │ │
│                                  │  └───────────┘ │
│  ┌────────────────────────────┐  │                 │
│  │ 2️⃣ BODY (Horizontal)        │  │  ┌───────────┐ │
│  │ DAC 16:45 ──✈── JFK 14:00  │  │  │ Fare      │ │
│  └────────────────────────────┘  │  │ Inclusions│ │
│                                  │  └───────────┘ │
│                                  │                 │
│  ┌────────────────────────────┐  │  ┌───────────┐ │
│  │ 4️⃣ TABBAR (at bottom)       │  │  │ Pricing   │ │
│  │ 🛡️ Refundable | Tabs        │  │  └───────────┘ │
│  └────────────────────────────┘  │                 │
│                                  │  ┌───────────┐ │
│                                  │  │  Select   │ │
│                                  │  │  Button   │ │
│                                  │  └───────────┘ │
└──────────────────────────────────┴─────────────────┘
```

## Key Implementation Points

### ✅ Mobile Order Rationale
1. **Header first** - Users need to know which airline immediately
2. **Body second** - Core flight information (times, duration, stops)
3. **Fare section third** - Price visibility before committing to action
4. **View Details button fourth** - Collapsed by default to reduce clutter, expandable to show tabbar
5. **Select button last** - Clear call-to-action after reviewing all info

### ✅ Mobile Footer Behavior
- **Default state**: Shows a single "View Details" button with chevron down icon
- **Expanded state**: Shows "Hide Details" button + Refundable badge + All info tabs (vertical list)
- **Purpose**: Reduces visual clutter on mobile, provides access to details when needed
- **Desktop**: Always shows full tabbar (no collapsing)

### ✅ Technical Implementation
- **Sidebar rendered twice**: Once for mobile (no button), once for desktop (with button)
- **Select button standalone on mobile**: Separate element after tabbar
- **Body always horizontal**: Uses `grid-cols-[1fr_auto_1fr]` without breakpoint prefix
- **Responsive font scaling**: All text scales down 60-80% on mobile

### ✅ User Flow
```
Mobile: 
  See airline → Check times → Review price → 
  (Optional: Click "View Details" to see tabs) → Select

Desktop: 
  See airline & times on left → Review price/features on right → 
  Tabs always visible at bottom → Select
```

### ✅ Mobile Footer States
**Collapsed (Default)**:
```tsx
[📄 View Details    ▼]
```
- Single button, clean appearance
- Click to expand

**Expanded**:
```tsx
[Hide Details    ▲]
├─ 🛡️ Refundable
├─ ✈️ Flight Details
├─ 💵 Fare Summary
├─ 🧳 Baggage
└─ 📄 Fare Rules
```
- Full vertical list of tabs
- Click "Hide Details" to collapse

## Code Snippets

### Mobile Sidebar (No Button)
```tsx
<div className="lg:hidden">
  <FlightCardSidebar 
    offer={offer}
    selectedFare={selectedFare}
    onFareChange={handleFareChange}
    showSelectButton={false}  // Key: No button on mobile
  />
</div>
```

### Mobile Select Button (Standalone)
```tsx
<div className="lg:hidden">
  <button
    onClick={handleSelect}
    className="w-full h-[48px] bg-primary text-white"
  >
    Select
  </button>
</div>
```

### Desktop Sidebar (With Button)
```tsx
<div className="hidden lg:flex">
  <FlightCardSidebar 
    offer={offer}
    selectedFare={selectedFare}
    onFareChange={handleFareChange}
    showSelectButton={true}   // Key: Button included
    onSelect={handleSelect}
  />
</div>
```

## Testing Checklist

### Mobile Order Verification
- [ ] Header appears first
- [ ] Body (flight times) appears second and is horizontal
- [ ] Fare section appears third (without select button)
- [ ] "View Details" button appears fourth (collapsed by default)
- [ ] Select button appears last at the bottom

### Mobile Footer Interaction
- [ ] Footer shows "View Details" button by default
- [ ] Clicking "View Details" expands to show all tabs
- [ ] Expanded view shows "Hide Details" button with chevron up
- [ ] Tabs display in vertical list when expanded
- [ ] Refundable badge shows above tabs when expanded
- [ ] Clicking "Hide Details" collapses back to single button
- [ ] Smooth transition between collapsed/expanded states

### Desktop Layout Verification
- [ ] Left column has Header → Body → Tabbar
- [ ] Right sidebar has Fare section with select button at bottom
- [ ] Tabbar is at bottom of left column (mt-auto)
- [ ] Layout is side-by-side (flex-row)

### Responsive Behavior
- [ ] Sidebar not duplicated visually (proper lg:hidden/hidden lg:flex usage)
- [ ] Select button only appears once at a time
- [ ] Font sizes scale appropriately
- [ ] No layout shift when resizing browser
