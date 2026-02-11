// Note: Avoid importing NextAuth types to keep build compatible across versions.
import { signInWithEmailAndPassword } from 'firebase/auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import FacebookProvider from 'next-auth/providers/facebook'
import GoogleProvider from 'next-auth/providers/google'

import { serverEnv } from '@/lib/env.server'
import { adminDb } from '@/lib/firebase/admin'
import { auth } from '@/lib/firebase/config'
import { isSuperAdminEmail, getUser, type UserDocument } from '@/lib/firebase/firestore'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      role: string
      isActive: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    isActive?: boolean
    statusCheckedAt?: number
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: serverEnv.GOOGLE_CLIENT_ID,
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
    }),
    FacebookProvider({
      clientId: serverEnv.FACEBOOK_CLIENT_ID,
      clientSecret: serverEnv.FACEBOOK_CLIENT_SECRET,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, _req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password,
          )

          const user = userCredential.user
          const userData = await getUser(user.uid)

          if (userData) {
            if (userData.metadata?.isActive === false) {
              throw new Error('ACCOUNT_INACTIVE')
            }

            // Update last login timestamp for credentials login
            try {
              const updateTime = new Date()
              await adminDb.collection('users').doc(String(user.uid)).update({
                'metadata.lastLoginAt': updateTime,
              })
            } catch (error) {
              console.error('❌ Error updating last login timestamp:', error)
            }

            return {
              id: user.uid,
              email: user.email || '',
              name: `${userData.profile.firstName} ${userData.profile.lastName}`,
              image: userData.profile.avatar ?? null,
              role: userData.role,
              isActive: true,
            }
          }

          return null
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async signIn({
      user,
      account,
    }: {
      user?: { id?: string; email?: string | null } | null
      account?: { provider?: string } | null
    }) {
      if (!user || !user.email) return false

      try {
        // Credentials checks happen in authorize()
        if (account?.provider === 'credentials') {
          return true
        }

        // For social login, block inactive existing users
        if ((account?.provider === 'google' || account?.provider === 'facebook') && user.id) {
          const userDoc = await adminDb.collection('users').doc(String(user.id)).get()
          if (userDoc.exists) {
            const userData = userDoc.data() as Partial<UserDocument>
            if (userData.metadata?.isActive === false) {
              return '/auth?error=inactive'
            }
          }
        }

        return true
      } catch (error) {
        console.error('Sign in error:', error)
        return true // Allow sign in and handle errors in jwt callback
      }
    },

    async jwt({
      token,
      user,
      account,
    }: {
      token: Record<string, unknown> & { role?: string; sub?: string }
      user?: {
        id?: string
        email?: string | null
        name?: string | null
        image?: string | null
        role?: string
        isActive?: boolean
      } | null
      account?: { provider?: string } | null
    }) {
      // Set role from user object for credentials login
      if (user && account?.provider === 'credentials') {
        token.role = user.role ?? 'User'
        token.isActive = user.isActive !== false
        token.statusCheckedAt = Date.now()
        return token
      }

      // Handle social logins - create user in Firestore if needed and assign role
      if (user && account && (account.provider === 'google' || account.provider === 'facebook')) {
        try {
          if (!user.id) {
            token.role = isSuperAdminEmail(user.email || '') ? 'SuperAdmin' : 'User'
            token.isActive = true
            token.statusCheckedAt = Date.now()
            return token
          }
          const userId = String(user.id)
          // Check if user exists in Firestore using Admin SDK
          const userDoc = await adminDb.collection('users').doc(userId).get()

          if (userDoc.exists) {
            const userData = userDoc.data() as Partial<UserDocument>
            token.role = userData?.role || 'User'
            token.isActive = userData?.metadata?.isActive !== false
            token.statusCheckedAt = Date.now()

            if (token.isActive === false) {
              return token
            }

            // Update last login time for existing user
            const updateTime = new Date()
            await adminDb.collection('users').doc(userId).update({
              'metadata.lastLoginAt': updateTime,
            })
          } else {
            // Create new user in Firestore using Admin SDK
            const role = isSuperAdminEmail(user.email || '') ? 'SuperAdmin' : 'User'
            const now = new Date()

            const userData = {
              uid: userId,
              email: user.email || '',
              role,
              category: role === 'SuperAdmin' ? 'Admin' : '',
              profile: {
                firstName: (user.name ?? '')?.split(' ')[0] || '',
                lastName: (user.name ?? '')?.split(' ').slice(1).join(' ') || '',
                gender: 'Other',
                dateOfBirth: '',
                mobile: '',
                avatar: user.image || '',
              },
              metadata: {
                createdAt: now,
                lastLoginAt: now,
                isActive: true,
                emailVerified: true,
              },
              permissions: [],
              assignedBy: '',
            }

            await adminDb.collection('users').doc(user.id).set(userData)
            token.role = role
            token.isActive = true
            token.statusCheckedAt = Date.now()
          }
        } catch (error) {
          console.error('Error handling social login:', error)
          // Fallback to default role
          token.role = isSuperAdminEmail(user.email || '') ? 'SuperAdmin' : 'User'
          token.isActive = true
          token.statusCheckedAt = Date.now()
        }
        return token
      }

      if (!user && token.sub) {
        const now = Date.now()
        const lastChecked =
          typeof token.statusCheckedAt === 'number' ? token.statusCheckedAt : 0

        if (now - lastChecked > 30_000 || typeof token.isActive !== 'boolean') {
          try {
            const userDoc = await adminDb.collection('users').doc(String(token.sub)).get()
            if (userDoc.exists) {
              const userData = userDoc.data() as Partial<UserDocument>
              token.role = userData?.role || token.role || 'User'
              token.isActive = userData?.metadata?.isActive !== false
            } else {
              token.isActive = false
            }
          } catch (error) {
            console.error('Error refreshing user status:', error)
          } finally {
            token.statusCheckedAt = now
          }
        }

        if (!token.role) token.role = 'User'
        if (typeof token.isActive !== 'boolean') token.isActive = true
        return token
      }

      // Default fallback
      if (!token.role) {
        token.role = 'User'
      }
      if (typeof token.isActive !== 'boolean') {
        token.isActive = true
      }
      if (typeof token.statusCheckedAt !== 'number') {
        token.statusCheckedAt = Date.now()
      }

      return token
    },

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
    session: (params: any) => {
      const { session, token } = params
      if (token) {
        session.user = {
          id: token.sub || '',
          email: token.email || '',
          name: token.name || '',
          image: token.picture || '',
          role: token.role,
          isActive: token.isActive !== false,
        }
      }
      return session
    },
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */

    redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Handle post-login redirects
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url

      // Default redirect to home page - middleware will handle role-based routing
      return baseUrl
    },
  },

  pages: {
    signIn: '/auth',
    error: '/auth',
  },

  session: {
    strategy: 'jwt' as const,
  },

  secret: serverEnv.NEXTAUTH_SECRET,
}
