import NextAuth from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'

// Force Node.js runtime so Firebase Admin and env load correctly (avoids Edge/Turbopack returning HTML on init errors)
export const runtime = 'nodejs'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
