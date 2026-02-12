import { NextResponse } from 'next/server'
import { withAuth, type NextRequestWithAuth } from 'next-auth/middleware'

import { DASHBOARD_ROUTES, ROLES, type RoleType } from '@/lib/utils/constants'

export const proxy = withAuth(
  function proxy(req: NextRequestWithAuth) {
    const token = req.nextauth.token
    const { pathname, searchParams } = req.nextUrl
    const isInactive = token && (token as { isActive?: boolean }).isActive === false

    // Redirect authenticated users from auth page to their dashboard
    // BUT preserve callbackUrl if it exists
    if (pathname === '/auth' && token && !isInactive) {
      const callbackUrl = searchParams.get('callbackUrl')

      if (callbackUrl) {
        // If there's a callbackUrl, redirect to it instead of the dashboard
        return NextResponse.redirect(new URL(callbackUrl, req.url))
      }

      // Otherwise, redirect to role-based dashboard
      const userRole = token.role as RoleType
      const dashboardRoute = DASHBOARD_ROUTES[userRole] || DASHBOARD_ROUTES[ROLES.USER]
      return NextResponse.redirect(new URL(dashboardRoute, req.url))
    }

    // Allow access to public routes for unauthenticated users
    if (
      (pathname === '/' ||
        pathname === '/auth' ||
        pathname === '/results' ||
        pathname === '/offer-price' ||
        pathname === '/privacy' ||
        pathname === '/terms' ||
        pathname === '/robots.txt' ||
        pathname === '/sitemap.xml') &&
      !token
    ) {
      return NextResponse.next()
    }

    // Redirect unauthenticated users to auth page for protected routes
    if (!token) {
      const redirectUrl = new URL('/auth', req.url)
      redirectUrl.searchParams.set('callbackUrl', req.nextUrl.href)
      return NextResponse.redirect(redirectUrl)
    }

    if (isInactive && pathname !== '/auth') {
      const redirectUrl = new URL('/auth', req.url)
      redirectUrl.searchParams.set('error', 'inactive')
      return NextResponse.redirect(redirectUrl)
    }

    const userRole = token.role as keyof typeof DASHBOARD_ROUTES

    // Check if user is accessing the correct dashboard for their role
    if (pathname.startsWith('/superadmin/admin')) {
      if (userRole !== ROLES.SUPER_ADMIN) {
        return NextResponse.redirect(new URL(DASHBOARD_ROUTES[userRole], req.url))
      }
    } else if (pathname.startsWith('/users/admin')) {
      if (userRole !== ROLES.ADMIN) {
        return NextResponse.redirect(new URL(DASHBOARD_ROUTES[userRole], req.url))
      }
    } else if (pathname.startsWith('/users/staff')) {
      if (userRole !== ROLES.STAFF) {
        return NextResponse.redirect(new URL(DASHBOARD_ROUTES[userRole], req.url))
      }
    } else if (pathname.startsWith('/users/partner')) {
      if (userRole !== ROLES.PARTNER) {
        return NextResponse.redirect(new URL(DASHBOARD_ROUTES[userRole], req.url))
      }
    } else if (pathname.startsWith('/users/agent')) {
      if (userRole !== ROLES.AGENT) {
        return NextResponse.redirect(new URL(DASHBOARD_ROUTES[userRole], req.url))
      }
    } else if (pathname.startsWith('/users/publicuser')) {
      if (userRole !== ROLES.USER) {
        return NextResponse.redirect(new URL(DASHBOARD_ROUTES[userRole], req.url))
      }
    }

    // Redirect to appropriate dashboard if accessing generic /dashboard
    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL(DASHBOARD_ROUTES[userRole], req.url))
    }

    return NextResponse.next()
  },
  {
    secret: (process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET)!,
    pages: {
      signIn: '/auth',
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow public routes
        if (
          pathname === '/' ||
          pathname === '/auth' ||
          pathname === '/results' ||
          pathname === '/offer-price' ||
          pathname === '/privacy' ||
          pathname === '/terms' ||
          pathname === '/robots.txt' ||
          pathname === '/sitemap.xml'
        ) {
          return true
        }

        // Require authentication and active status for all other routes
        return !!token && (token as { isActive?: boolean }).isActive !== false
      },
    },
  },
)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|fonts).*)'],
}
