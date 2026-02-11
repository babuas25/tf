import { FlightSearchPageClient } from '@/app/results/flight-search-client'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Flight Search - TripFeels',
  description: 'Search and book flights with TripFeels. Find the best deals on domestic and international flights.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function FlightSearchPage() {
  return <FlightSearchPageClient />
}