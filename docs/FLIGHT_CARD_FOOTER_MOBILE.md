# FlightCard Footer - Mobile Collapsible Behavior

## Overview
The FlightCardFooter now has different behaviors on mobile vs desktop to optimize screen space and reduce visual clutter.

## Mobile Behavior (< 1024px)

### Default State: Collapsed
```
┌─────────────────────────────────────┐
│  📄 View Details            ▼       │
└─────────────────────────────────────┘
```
- Shows a single button with "View Details" text
- Chevron down icon indicates it can expand
- Takes minimal vertical space
- Centered layout with hover effect

### Expanded State: Full Tabbar
```
┌─────────────────────────────────────┐
│  Hide Details               ▲       │
├─────────────────────────────────────┤
│  🛡️ Refundable                      │
├─────────────────────────────────────┤
│  ✈️  Flight Details                 │
├─────────────────────────────────────┤
│  💵 Fare Summary                    │
├─────────────────────────────────────┤
│  🧳 Baggage                         │
├─────────────────────────────────────┤
│  📄 Fare Rules                      │
└─────────────────────────────────────┘
```
- Shows "Hide Details" button at top with chevron up
- Refundable badge displayed (if applicable)
- All tabs displayed as full-width buttons in vertical list
- Each tab has icon + label, aligned left
- Easy touch targets (full width)

## Desktop Behavior (≥ 1024px)

### Always Expanded: Horizontal Tabbar
```
┌─────────────────────────────────────────────────────────────┐
│  🛡️ Refundable    [✈️ Details] [💵 Fare] [🧳 Bag] [📄 Rules] │
└─────────────────────────────────────────────────────────────┘
```
- Traditional horizontal layout
- Refundable badge on left
- Tab buttons on right
- Always visible (no collapsing)
- Compact horizontal layout

## Implementation Details

### State Management
```tsx
const [isExpanded, setIsExpanded] = useState(false)

const toggleExpand = () => {
  setIsExpanded(!isExpanded)
}
```

### Mobile Layout Structure
```tsx
<div className="lg:hidden">
  {!isExpanded ? (
    // Collapsed: View Details Button
    <button onClick={toggleExpand}>
      <FileText /> View Details <ChevronDown />
    </button>
  ) : (
    // Expanded: Full Tabbar
    <div>
      <button onClick={toggleExpand}>
        Hide Details <ChevronUp />
      </button>
      <div>
        {/* Refundable badge */}
        {/* Vertical tab list */}
      </div>
    </div>
  )}
</div>
```

### Desktop Layout Structure
```tsx
<div className="hidden lg:block">
  <div className="flex items-center justify-between">
    {/* Refundable badge */}
    {/* Horizontal tab buttons */}
  </div>
</div>
```

## Why This Design?

### ✅ Mobile Benefits
1. **Reduced Clutter**: Most users don't need detailed tabs immediately
2. **Faster Scanning**: Cleaner interface helps users focus on price and main details
3. **Progressive Disclosure**: Details available on demand without overwhelming
4. **Better Touch UX**: Full-width buttons in expanded state are easier to tap
5. **Space Efficient**: Saves ~150-200px of vertical space when collapsed

### ✅ Desktop Benefits
1. **Always Accessible**: Power users expect all options visible
2. **Mouse Precision**: Smaller buttons work fine with mouse/trackpad
3. **Screen Real Estate**: Desktop has enough space for horizontal layout
4. **Familiarity**: Matches common desktop UI patterns

## User Interaction Flow

### Primary Flow (Skip Details)
```
View Flight → Check Price → Select
```
Most users just need to see price and select. Details button is available but not required.

### Secondary Flow (Check Details)
```
View Flight → Check Price → Click "View Details" → 
Review Baggage/Fare Rules → Select
```
Users who want more info can expand to see all details before selecting.

## Visual States

### Collapsed Button States
| State | Background | Text Color | Icon |
|-------|-----------|------------|------|
| Normal | gray-50 | gray-700 | ChevronDown |
| Hover | gray-100 | gray-700 | ChevronDown |
| Active | gray-100 | gray-700 | ChevronDown |

### Expanded Button States
| Element | Style |
|---------|-------|
| Hide Button | Same as collapsed button, ChevronUp icon |
| Refundable Badge | Primary color, small text |
| Tab Buttons | Full width, left-aligned, larger touch target |
| Active Tab | Primary background, white text |
| Inactive Tab | Gray text, hover effect |

## Accessibility

### Keyboard Navigation
- Tab key navigates to "View Details" button
- Enter/Space toggles expansion
- When expanded, Tab navigates through each detail button
- Escape key can collapse (optional enhancement)

### Screen Readers
- Button announces "View Details, button, collapsed"
- When expanded: "Hide Details, button, expanded"
- Each tab button has descriptive label
- Refundable badge announced if present

## Performance Notes
- No animation overhead (instant expand/collapse)
- State managed locally in component
- No network requests on toggle
- Minimal re-renders

## Code Examples

### Collapsed Button
```tsx
<button
  onClick={toggleExpand}
  className="w-full flex items-center justify-center gap-2 
             bg-gray-50 dark:bg-gray-800/50 px-4 py-3 
             hover:bg-gray-100 dark:hover:bg-gray-800"
>
  <FileText className="w-4 h-4" />
  <span className="text-sm font-medium">View Details</span>
  <ChevronDown className="w-4 h-4" />
</button>
```

### Expanded Tab List
```tsx
<div className="flex flex-col gap-1">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      className="flex items-center gap-2 px-3 py-2.5 
                 text-xs font-medium rounded
                 hover:bg-primary/10"
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="flex-1 text-left">{tab.label}</span>
    </button>
  ))}
</div>
```

## Future Enhancements

### Possible Improvements
1. Add smooth height animation when expanding/collapsing
2. Auto-collapse when user scrolls down
3. Remember expanded state per session
4. Add badge count for tabs with new information
5. Swipe gesture to expand/collapse on mobile

### A/B Testing Ideas
- Test if more users engage with details when collapsed by default
- Measure conversion rates with different default states
- Track which tabs are most accessed on mobile
