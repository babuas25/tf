import { Analytics } from '@vercel/analytics/react'
import { GeistSans } from 'geist/font/sans'
import { Poppins } from 'next/font/google'
import { cookies } from 'next/headers'

import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { ErrorMonitoringProvider } from '@/components/providers/error-monitoring-provider'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ThemeSystemProvider } from '@/components/theme-provider'
import { ThemeProvider as CustomThemeProvider } from '@/context/theme-context'

import type { Metadata } from 'next'

import './globals.css'

// Import console helpers for development
if (process.env.NODE_ENV === 'development') {
  void import('@/lib/utils/console-helpers')
}

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-poppins',
  preload: false, // Only used via CSS variable in specific components; avoid preload warning
})

// This layout reads cookies in generateMetadata, so it must be dynamic.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const store = await cookies()
  const titleCookie = store.get('seo_title')?.value?.trim()
  const descCookie = store.get('seo_description')?.value?.trim()
  const keywordsCookie = store.get('seo_keywords')?.value?.trim()

  const fallbackTitle = 'TripFeels - Role-Based Dashboard'
  const siteTitle = titleCookie && titleCookie.length > 0 ? titleCookie : fallbackTitle
  const description =
    descCookie && descCookie.length > 0
      ? descCookie
      : 'A comprehensive role-based dashboard system for managing users, staff, partners, and agents. Secure, scalable, and user-friendly platform for travel management.'
  const keywords = (
    keywordsCookie ||
    'dashboard, role-based, travel management, user management, admin panel, tripfeels'
  )
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  return {
    title: {
      default: siteTitle,
      template: `%s | ${siteTitle}`,
    },
    description,
    keywords,
    authors: [{ name: 'TripFeels Team' }],
    creator: 'TripFeels',
    publisher: 'TripFeels',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL('https://tripfeels.com'),
    alternates: { canonical: '/' },
    openGraph: {
      title: siteTitle,
      description,
      url: 'https://tripfeels.com',
      siteName: siteTitle,
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description,
      creator: '@tripfeels',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: 'your-google-verification-code',
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Trusted Types support
              if (window.trustedTypes && window.trustedTypes.createPolicy) {
                window.trustedTypes.createPolicy('default', {
                  createHTML: (string) => string,
                  createScript: (string) => string,
                  createScriptURL: (string) => string,
                });
              }

              try {
                const storedTheme = localStorage.getItem('tripfeels-theme');
                const root = document.documentElement;
                root.classList.remove('light', 'dark');

                if (storedTheme === 'light' || storedTheme === 'dark') {
                  root.classList.add(storedTheme);
                } else {
                  // Auto-detect system preference if no valid stored theme
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  root.classList.add(systemTheme);
                  localStorage.setItem('tripfeels-theme', systemTheme);
                }
              } catch (e) {
                // Fallback to system theme if localStorage is not available
                const root = document.documentElement;
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                root.classList.add(systemTheme);
              }
            `,
          }}
        />
      </head>
      <body className={`${GeistSans.className} ${poppins.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'TripFeels',
              description:
                'A comprehensive role-based dashboard system for managing users, staff, partners, and agents. Secure, scalable, and user-friendly platform for travel management.',
              url: 'https://tripfeels.com',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              author: {
                '@type': 'Organization',
                name: 'TripFeels Team',
              },
              publisher: {
                '@type': 'Organization',
                name: 'TripFeels',
              },
            }),
          }}
        />
        <ErrorBoundary>
          <ThemeProvider defaultTheme="light" storageKey="tripfeels-theme">
            <ThemeSystemProvider>
              <CustomThemeProvider>
                <AuthSessionProvider>
                  <ErrorMonitoringProvider>{children}</ErrorMonitoringProvider>
                </AuthSessionProvider>
              </CustomThemeProvider>
            </ThemeSystemProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
