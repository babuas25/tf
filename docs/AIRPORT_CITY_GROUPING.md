# Airport City Grouping Implementation

## Overview

This implementation organizes airports by city, displaying them in a hierarchical structure where cities with multiple airports show as parent items with individual airports as sub-items underneath.

## Features

### Visual Organization

- **City Groups**: Cities with multiple airports display with a MapPin icon and show "City, Country" format
- **Individual Airports**: Show with PlaneTakeoff icon and are indented under their city group
- **Single Airports**: Cities with only one airport display as individual items without grouping

### Search Functionality

- Search by city name (e.g., "London" shows all London airports)
- Search by airport name (e.g., "Heathrow" finds London Heathrow)
- Search by IATA code (e.g., "LHR" finds London Heathrow)
- Search by country name (e.g., "United Kingdom" shows UK airports)

## Implementation Details

### Files Created/Modified

1. **`src/components/flight/city-airport-mapping.ts`**
   - Contains mapping of IATA codes to proper city information
   - Includes major international airports grouped by city
   - Provides utility functions for city grouping logic

2. **`src/components/flight/AirportSelection.tsx`**
   - Updated to use city mapping for proper grouping
   - Enhanced UI to show city groups vs individual airports
   - Prevents selection of city group headers

3. **`src/app/test-airports/page.tsx`**
   - Test page to demonstrate the new functionality

### Key Components

#### City Mapping Structure

```typescript
export interface CityInfo {
  city: string
  country: string
  countryCode: string
  cityCode?: string // Metro area code like LON for London
}
```

#### Airport Option Type

```typescript
export type AirportOption = {
  id: string
  name: string
  city: string
  country: string
  iata: string
  isCity?: boolean // Flag for city group headers
  cityCode?: string // Metro area code
}
```

### Supported Cities with Multiple Airports

- **London, UK** (LON): LHR, LGW, STN, LTN, LCY, SEN
- **New York, USA** (NYC): JFK, LGA, EWR
- **Paris, France** (PAR): CDG, ORY, BVA
- **Tokyo, Japan** (TYO): NRT, HND
- **Los Angeles, USA** (LAX): LAX, BUR, LGB, SNA
- **Chicago, USA** (CHI): ORD, MDW
- **Milan, Italy** (MIL): MXP, LIN, BGY
- **Berlin, Germany** (BER): BER, SXF, TXL
- **Moscow, Russia** (MOW): SVO, DME, VKO
- **Washington, USA** (WAS): DCA, IAD, BWI
- **San Francisco, USA** (SFO): SFO, OAK, SJC
- **Rome, Italy** (ROM): FCO, CIA
- **Stockholm, Sweden** (STO): ARN, BMA, NYO
- And many more...

## Usage Examples

### Basic Usage

```typescript
import { AirportSelection, type AirportOption } from '@/components/flight/AirportSelection'

const [selectedAirport, setSelectedAirport] = useState<AirportOption | null>(null)

<AirportSelection
  label="Select Airport"
  value={selectedAirport}
  onChange={setSelectedAirport}
  inputId="airport-select"
  inputName="airport"
  placeholder="Search for airports or cities..."
/>
```

### Testing the Feature

Visit `/test-airports` to see the implementation in action:

1. **Search for "lon"** - See London airports grouped under "London, United Kingdom"
2. **Search for "new"** - See New York airports grouped under "New York, United States"
3. **Search for "LHR"** - Find London Heathrow directly
4. **Click on city groups** - Notice they don't get selected (only individual airports can be selected)

## Benefits

1. **Better UX**: Users can easily find airports by city name
2. **Reduced Confusion**: Clear distinction between city groups and individual airports
3. **Scalable**: Easy to add more cities and airports to the mapping
4. **Flexible**: Falls back to airport name extraction for unmapped airports
5. **Visual Clarity**: Icons and indentation make the hierarchy clear

## Future Enhancements

1. **Dynamic Loading**: Load city mappings from an API
2. **Geolocation**: Show nearby airports first
3. **Popular Airports**: Prioritize frequently used airports
4. **Custom Grouping**: Allow users to create custom airport groups
5. **Multi-language**: Support city names in different languages

## Maintenance

To add new cities or airports:

1. Add entries to `cityAirportMapping` in `city-airport-mapping.ts`
2. Use consistent city codes (3-letter codes work well)
3. Ensure country names match existing patterns
4. Test the new mappings using the test page

The system automatically handles grouping logic based on the mapping data.
