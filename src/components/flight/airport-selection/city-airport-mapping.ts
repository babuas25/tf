// City to airport mapping for better organization
// This maps IATA codes to their actual cities for proper grouping

export interface CityInfo {
  city: string
  country: string
  countryCode: string
  cityCode?: string // Metro area code like LON for London
}

export const cityAirportMapping: Record<string, CityInfo> = {
  // London, UK
  LHR: { city: 'London', country: 'United Kingdom', countryCode: 'GB', cityCode: 'LON' },
  LGW: { city: 'London', country: 'United Kingdom', countryCode: 'GB', cityCode: 'LON' },
  STN: { city: 'London', country: 'United Kingdom', countryCode: 'GB', cityCode: 'LON' },
  LTN: { city: 'London', country: 'United Kingdom', countryCode: 'GB', cityCode: 'LON' },
  LCY: { city: 'London', country: 'United Kingdom', countryCode: 'GB', cityCode: 'LON' },
  SEN: { city: 'London', country: 'United Kingdom', countryCode: 'GB', cityCode: 'LON' },
  BQH: { city: 'London', country: 'United Kingdom', countryCode: 'GB', cityCode: 'LON' },

  // New York, USA
  JFK: { city: 'New York', country: 'United States', countryCode: 'US', cityCode: 'NYC' },
  LGA: { city: 'New York', country: 'United States', countryCode: 'US', cityCode: 'NYC' },
  EWR: { city: 'New York', country: 'United States', countryCode: 'US', cityCode: 'NYC' },

  // Paris, France
  CDG: { city: 'Paris', country: 'France', countryCode: 'FR', cityCode: 'PAR' },
  ORY: { city: 'Paris', country: 'France', countryCode: 'FR', cityCode: 'PAR' },
  BVA: { city: 'Paris', country: 'France', countryCode: 'FR', cityCode: 'PAR' },

  // Tokyo, Japan
  NRT: { city: 'Tokyo', country: 'Japan', countryCode: 'JP', cityCode: 'TYO' },
  HND: { city: 'Tokyo', country: 'Japan', countryCode: 'JP', cityCode: 'TYO' },

  // Dubai, UAE
  DXB: { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', cityCode: 'DXB_CITY' },
  DWC: { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', cityCode: 'DXB_CITY' },

  // Bangkok, Thailand
  BKK: { city: 'Bangkok', country: 'Thailand', countryCode: 'TH', cityCode: 'BKK_CITY' },
  DMK: { city: 'Bangkok', country: 'Thailand', countryCode: 'TH', cityCode: 'BKK_CITY' },

  // Singapore
  SIN: { city: 'Singapore', country: 'Singapore', countryCode: 'SG', cityCode: 'SIN_CITY' },

  // Hong Kong
  HKG: { city: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', cityCode: 'HKG_CITY' },

  // Los Angeles, USA
  LAX: { city: 'Los Angeles', country: 'United States', countryCode: 'US', cityCode: 'LAX_CITY' },
  BUR: { city: 'Los Angeles', country: 'United States', countryCode: 'US', cityCode: 'LAX_CITY' },
  LGB: { city: 'Los Angeles', country: 'United States', countryCode: 'US', cityCode: 'LAX_CITY' },
  SNA: { city: 'Los Angeles', country: 'United States', countryCode: 'US', cityCode: 'LAX_CITY' },

  // Chicago, USA
  ORD: { city: 'Chicago', country: 'United States', countryCode: 'US', cityCode: 'CHI' },
  MDW: { city: 'Chicago', country: 'United States', countryCode: 'US', cityCode: 'CHI' },

  // Milan, Italy
  MXP: { city: 'Milan', country: 'Italy', countryCode: 'IT', cityCode: 'MIL' },
  LIN: { city: 'Milan', country: 'Italy', countryCode: 'IT', cityCode: 'MIL' },
  BGY: { city: 'Milan', country: 'Italy', countryCode: 'IT', cityCode: 'MIL' },

  // Berlin, Germany
  BER: { city: 'Berlin', country: 'Germany', countryCode: 'DE', cityCode: 'BER_CITY' },
  SXF: { city: 'Berlin', country: 'Germany', countryCode: 'DE', cityCode: 'BER_CITY' },
  TXL: { city: 'Berlin', country: 'Germany', countryCode: 'DE', cityCode: 'BER_CITY' },

  // Moscow, Russia
  SVO: { city: 'Moscow', country: 'Russia', countryCode: 'RU', cityCode: 'MOW' },
  DME: { city: 'Moscow', country: 'Russia', countryCode: 'RU', cityCode: 'MOW' },
  VKO: { city: 'Moscow', country: 'Russia', countryCode: 'RU', cityCode: 'MOW' },

  // Istanbul, Turkey
  IST: { city: 'Istanbul', country: 'Turkey', countryCode: 'TR', cityCode: 'IST_CITY' },
  SAW: { city: 'Istanbul', country: 'Turkey', countryCode: 'TR', cityCode: 'IST_CITY' },

  // Mumbai, India
  BOM: { city: 'Mumbai', country: 'India', countryCode: 'IN', cityCode: 'BOM_CITY' },

  // Delhi, India
  DEL: { city: 'Delhi', country: 'India', countryCode: 'IN', cityCode: 'DEL_CITY' },

  // Dhaka, Bangladesh
  DAC: { city: 'Dhaka', country: 'Bangladesh', countryCode: 'BD', cityCode: 'DAC_CITY' },

  // Chittagong, Bangladesh
  CGP: { city: 'Chittagong', country: 'Bangladesh', countryCode: 'BD', cityCode: 'CGP_CITY' },

  // Sylhet, Bangladesh
  ZYL: { city: 'Sylhet', country: 'Bangladesh', countryCode: 'BD', cityCode: 'ZYL_CITY' },

  // Cox's Bazar, Bangladesh
  CXB: { city: "Cox's Bazar", country: 'Bangladesh', countryCode: 'BD', cityCode: 'CXB_CITY' },

  // Kathmandu, Nepal
  KTM: { city: 'Kathmandu', country: 'Nepal', countryCode: 'NP', cityCode: 'KTM_CITY' },

  // Colombo, Sri Lanka
  CMB: { city: 'Colombo', country: 'Sri Lanka', countryCode: 'LK', cityCode: 'CMB_CITY' },

  // Karachi, Pakistan
  KHI: { city: 'Karachi', country: 'Pakistan', countryCode: 'PK', cityCode: 'KHI_CITY' },

  // Lahore, Pakistan
  LHE: { city: 'Lahore', country: 'Pakistan', countryCode: 'PK', cityCode: 'LHE_CITY' },

  // Islamabad, Pakistan
  ISB: { city: 'Islamabad', country: 'Pakistan', countryCode: 'PK', cityCode: 'ISB_CITY' },

  // Guangzhou, China
  CAN: { city: 'Guangzhou', country: 'China', countryCode: 'CN', cityCode: 'CAN_CITY' },

  // Beijing, China
  PEK: { city: 'Beijing', country: 'China', countryCode: 'CN', cityCode: 'BJS' },
  PKX: { city: 'Beijing', country: 'China', countryCode: 'CN', cityCode: 'BJS' },

  // Shanghai, China
  PVG: { city: 'Shanghai', country: 'China', countryCode: 'CN', cityCode: 'SHA' },
  SHA: { city: 'Shanghai', country: 'China', countryCode: 'CN', cityCode: 'SHA' },

  // Washington DC, USA
  DCA: { city: 'Washington', country: 'United States', countryCode: 'US', cityCode: 'WAS' },
  IAD: { city: 'Washington', country: 'United States', countryCode: 'US', cityCode: 'WAS' },
  BWI: { city: 'Washington', country: 'United States', countryCode: 'US', cityCode: 'WAS' },

  // San Francisco, USA
  SFO: { city: 'San Francisco', country: 'United States', countryCode: 'US', cityCode: 'SFO_CITY' },
  OAK: { city: 'San Francisco', country: 'United States', countryCode: 'US', cityCode: 'SFO_CITY' },
  SJC: { city: 'San Francisco', country: 'United States', countryCode: 'US', cityCode: 'SFO_CITY' },

  // Rome, Italy
  FCO: { city: 'Rome', country: 'Italy', countryCode: 'IT', cityCode: 'ROM' },
  CIA: { city: 'Rome', country: 'Italy', countryCode: 'IT', cityCode: 'ROM' },

  // Barcelona, Spain
  BCN: { city: 'Barcelona', country: 'Spain', countryCode: 'ES', cityCode: 'BCN_CITY' },

  // Madrid, Spain
  MAD: { city: 'Madrid', country: 'Spain', countryCode: 'ES', cityCode: 'MAD_CITY' },

  // Amsterdam, Netherlands
  AMS: { city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', cityCode: 'AMS_CITY' },

  // Frankfurt, Germany
  FRA: { city: 'Frankfurt', country: 'Germany', countryCode: 'DE', cityCode: 'FRA_CITY' },

  // Zurich, Switzerland
  ZUR: { city: 'Zurich', country: 'Switzerland', countryCode: 'CH', cityCode: 'ZUR_CITY' },

  // Vienna, Austria
  VIE: { city: 'Vienna', country: 'Austria', countryCode: 'AT', cityCode: 'VIE_CITY' },

  // Stockholm, Sweden
  ARN: { city: 'Stockholm', country: 'Sweden', countryCode: 'SE', cityCode: 'STO' },
  BMA: { city: 'Stockholm', country: 'Sweden', countryCode: 'SE', cityCode: 'STO' },
  NYO: { city: 'Stockholm', country: 'Sweden', countryCode: 'SE', cityCode: 'STO' },

  // Oslo, Norway
  OSL: { city: 'Oslo', country: 'Norway', countryCode: 'NO', cityCode: 'OSL_CITY' },

  // Copenhagen, Denmark
  CPH: { city: 'Copenhagen', country: 'Denmark', countryCode: 'DK', cityCode: 'CPH_CITY' },

  // Helsinki, Finland
  HEL: { city: 'Helsinki', country: 'Finland', countryCode: 'FI', cityCode: 'HEL_CITY' },

  // Add more mappings as needed...
}

// Function to get city info for an airport
export function getCityInfo(iata: string): CityInfo | null {
  return cityAirportMapping[iata.toUpperCase()] || null
}

// Function to get all airports for a city
export function getAirportsForCity(cityCode: string): string[] {
  return Object.entries(cityAirportMapping)
    .filter(([_, info]) => info.cityCode === cityCode)
    .map(([iata]) => iata)
}

// Function to check if a city has multiple airports
export function isMultiAirportCity(cityCode: string): boolean {
  return getAirportsForCity(cityCode).length > 1
}
