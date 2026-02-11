import { HomePageClient } from './home-page-client'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welcome to TripFeels - Role-Based Dashboard',
  description:
    'Welcome to TripFeels, your personalized dashboard and travel management platform. Access your travel information, manage itineraries, and update your profile preferences.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function HomePage() {
  return (
    <>
      <HomePageClient />
    </>
  )
}
