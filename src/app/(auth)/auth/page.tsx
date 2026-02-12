'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import AuthSlideshow from '@/components/auth/AuthSlideshow'
import FirebaseStatus from '@/components/debug/FirebaseStatus'
import { Header } from '@/components/layout/header'
// Removed unused Card imports
import { DynamicButton } from '@/components/ui/dynamic-theme-components'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { authWithRetry, handleFirebaseError, connectionMonitor } from '@/lib/firebase/connection'
import { createUser, isSuperAdminEmail } from '@/lib/firebase/firestore'
import { DASHBOARD_ROUTES, type RoleType } from '@/lib/utils/constants'
import {
  registrationSchema,
  signInSchema,
  type RegistrationFormData,
  type SignInFormData,
} from '@/lib/utils/validation'

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('signin')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const callbackUrl = searchParams.get('callbackUrl')

  // If user is already logged in and somehow lands on /auth,
  // automatically redirect them to their role-based dashboard.
  useEffect(() => {
    if (!session?.user) return

    const role = (session.user as { role?: RoleType } | undefined)?.role
    if (!role) return

    const dashboardRoute = DASHBOARD_ROUTES[role]
    if (dashboardRoute) {
      router.replace(dashboardRoute)
    }
  }, [session, router])

  useEffect(() => {
    const authError = searchParams.get('error')
    if (authError === 'inactive') {
      setError('Your account is inactive. Please contact an administrator.')
    }
  }, [searchParams])

  // Connection monitoring
  useEffect(() => {
    const unsubscribe = connectionMonitor.onConnectionChange((online) => {
      setIsOnline(online)
      if (!online) {
        setError('No internet connection. Please check your network and try again.')
      }
    })

    // Set initial connection status
    setIsOnline(connectionMonitor.getConnectionStatus())

    return unsubscribe
  }, [])

  const wrapper = useMemo(() => {
    return {
      className: 'min-h-screen bg-white dark:bg-black',
      style: {},
    }
  }, [])

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  // Sign In Form
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  // Registration Form
  const registrationForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      gender: 'Male',
      dateOfBirth: '',
      mobile: '',
      acceptTerms: false,
    },
  })

  const handleSignIn = async (data: SignInFormData) => {
    if (!isOnline) {
      setError('No internet connection. Please check your network and try again.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.ok) {
        // Check if there's a callback URL to redirect to
        if (callbackUrl) {
          router.push(callbackUrl)
        } else {
          // Otherwise, redirect to role-based dashboard
          const session = await getSession()
          const role = (session?.user as { role?: RoleType } | undefined)?.role
          if (role) {
            const dashboardRoute = DASHBOARD_ROUTES[role]
            if (dashboardRoute) {
              router.push(dashboardRoute)
            }
          }
        }
      } else {
        console.error('Sign in failed:', result?.error)
        if (result?.error?.includes('ACCOUNT_INACTIVE')) {
          setError('Your account is inactive. Please contact an administrator.')
        } else {
          setError('Invalid email or password. Please try again.')
        }
      }
    } catch (error: unknown) {
      console.error('Sign in error:', error)
      const errorMessage = handleFirebaseError(error)
      setError(errorMessage)

      // Handle specific cases
      const errorCode =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code)
          : undefined
      if (errorCode === 'auth/user-not-found') {
        setActiveTab('register')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegistration = async (data: RegistrationFormData) => {
    if (!isOnline) {
      setError('No internet connection. Please check your network and try again.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create Firebase user with retry logic
      const user = await authWithRetry.signUp(data.email, data.password)
      const role = isSuperAdminEmail(data.email) ? 'SuperAdmin' : 'User'

      // Create user document in Firestore
      await createUser({
        uid: user.uid,
        email: data.email,
        role,
        profile: {
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          mobile: data.mobile,
        },
      })

      // Sign in the user
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.ok) {
        // Check if there's a callback URL to redirect to
        if (callbackUrl) {
          router.push(callbackUrl)
        } else {
          // Otherwise, redirect to role-based dashboard
          const session = await getSession()
          const role = (session?.user as { role?: RoleType } | undefined)?.role
          if (role) {
            const dashboardRoute = DASHBOARD_ROUTES[role]
            if (dashboardRoute) {
              router.push(dashboardRoute)
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error('Registration error:', error)
      const errorMessage = handleFirebaseError(error)
      setError(errorMessage)

      // Handle specific cases
      const errorCode =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code)
          : undefined
      if (errorCode === 'auth/email-already-in-use') {
        setActiveTab('signin')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    if (!isOnline) {
      setError('No internet connection. Please check your network and try again.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Use redirect: true to let NextAuth handle the redirect
      // The middleware will handle role-based routing after authentication
      await signIn(provider, {
        redirect: true,
      })
    } catch (error) {
      console.error('Social sign in error:', error)
      const errorMessage = handleFirebaseError(error)
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className={wrapper.className} style={wrapper.style}>
      {/* Connection status indicator */}
      {!isOnline && (
        <div className="fixed top-14 left-0 right-0 z-50 bg-red-500 text-white text-center py-2 text-sm">
          ⚠️ No internet connection. Please check your network.
        </div>
      )}

      <Header
        showNavigation={false}
        showUserActions={true}
        onMobileMenuToggle={toggleMobileSidebar}
      />

      {/* Main content with sidebar for logged-in users */}
      <div className="flex pt-14 min-h-[calc(100vh-3.5rem)] relative z-10">
        {/* Mobile Sidebar Overlay for non-logged-in users */}
        {!session?.user && isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden" onClick={closeMobileSidebar}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Public Sidebar */}
            <div className="relative h-full w-64">
              <div className="flex flex-col backdrop-blur-md bg-white/20 dark:bg-white/10 border-r border-white/30 dark:border-white/20 shadow-lg h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4">
                  <h2 className="text-xl font-bold font-logo text-primary">tripfeels</h2>
                  <button
                    onClick={closeMobileSidebar}
                    className="h-8 w-8 font-bold hover:bg-white/20 dark:hover:bg-white/10 border border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg flex items-center justify-center"
                    aria-label="Close sidebar"
                  >
                    <svg
                      className="h-4 w-4 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Divider */}
                <div className="border-b border-white/20 dark:border-white/10"></div>

                {/* Public Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                  <Link
                    href="/"
                    onClick={closeMobileSidebar}
                    className="group flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-primary/70 group-hover:text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span>Home</span>
                  </Link>

                  <Link
                    href="/privacy"
                    onClick={closeMobileSidebar}
                    className="group flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-primary/70 group-hover:text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span>Privacy Policy</span>
                  </Link>

                  <Link
                    href="/terms"
                    onClick={closeMobileSidebar}
                    className="group flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-primary/70 group-hover:text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>Terms & Conditions</span>
                  </Link>
                </nav>

                {/* Divider */}
                <div className="border-b border-white/20 dark:border-white/10"></div>

                {/* Sign In Button */}
                <div className="p-4">
                  <button
                    onClick={() => {
                      closeMobileSidebar()
                      setActiveTab('signin')
                    }}
                    className="w-full flex items-center justify-center gap-3 px-3 py-2 hover:bg-white/20 dark:hover:bg-white/10 border border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm font-medium"
                  >
                    <svg
                      className="h-5 w-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>Sign In</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className={`${session?.user ? 'flex-1' : 'w-full'} flex`}>
          {/* Left Section - Slideshow (only for non-logged-in users) */}
          {!session?.user && <AuthSlideshow />}

          {/* Right Section - Auth Form */}
          <div
            className={`${session?.user ? 'w-full' : 'w-full lg:w-1/2'} flex justify-center p-8 min-h-[calc(100vh-3.5rem)]`}
          >
            <div className="w-full max-w-md space-y-6 flex flex-col justify-center">
              {/* Auth Form Container with Glassmorphism */}
              <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg p-8">
                {/* Header */}
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {activeTab === 'signin' ? 'Sign in to your account' : 'Create an account'}
                  </h1>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {activeTab === 'signin'
                      ? 'Enter your email below to sign in to your account'
                      : 'Enter your email below to create your account'}
                  </p>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
                  </div>
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg">
                    <TabsTrigger
                      value="signin"
                      className="data-[state=active]:bg-white/30 dark:data-[state=active]:bg-white/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 text-gray-600 dark:text-gray-400 rounded-lg"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="register"
                      className="data-[state=active]:bg-white/30 dark:data-[state=active]:bg-white/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 text-gray-600 dark:text-gray-400 rounded-lg"
                    >
                      Register
                    </TabsTrigger>
                  </TabsList>

                  {/* Sign In Tab */}
                  <TabsContent value="signin" className="space-y-4">
                    <Form {...signInForm}>
                      <form
                        onSubmit={(e) => {
                          void signInForm.handleSubmit(handleSignIn)(e)
                        }}
                        className="space-y-4"
                      >
                        <FormField
                          control={signInForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="name@example.com"
                                  className="h-10 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={signInForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Password"
                                  className="h-10 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <DynamicButton
                          type="submit"
                          variant="primary"
                          className="w-full h-10"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Signing In...' : 'Sign In with Email'}
                        </DynamicButton>
                      </form>
                    </Form>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/30 dark:border-white/20" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white/20 dark:bg-white/10 backdrop-blur-sm px-3 text-gray-600 dark:text-gray-400 rounded-lg">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <DynamicButton
                        variant="outline"
                        onClick={() => void handleSocialSignIn('google')}
                        disabled={isLoading}
                        className="h-10"
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        Google
                      </DynamicButton>
                      <DynamicButton
                        variant="outline"
                        onClick={() => void handleSocialSignIn('facebook')}
                        disabled={isLoading}
                        className="h-10"
                      >
                        <svg className="mr-2 h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                      </DynamicButton>
                    </div>
                  </TabsContent>

                  {/* Registration Tab */}
                  <TabsContent value="register" className="space-y-4">
                    <Form {...registrationForm}>
                      <form
                        onSubmit={(e) => {
                          void registrationForm.handleSubmit(handleRegistration)(e)
                        }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registrationForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="First name"
                                    className="h-10 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registrationForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Last name"
                                    className="h-10 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={registrationForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="name@example.com"
                                  className="h-10 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registrationForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Password"
                                  className="h-10 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registrationForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Confirm Password"
                                  className="h-10 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registrationForm.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <select
                                    className="flex h-10 w-full rounded-lg border border-white/30 dark:border-white/20 bg-white/20 dark:bg-white/10 backdrop-blur-sm px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                    {...field}
                                  >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                  </select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registrationForm.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="date"
                                    className="h-10 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={registrationForm.control}
                          name="mobile"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="Mobile Number"
                                  className="h-10 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registrationForm.control}
                          name="acceptTerms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="mt-1 h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm text-foreground">
                                  I accept the terms and conditions
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                        <DynamicButton
                          type="submit"
                          variant="primary"
                          className="w-full h-10"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Creating Account...' : 'Create Account'}
                        </DynamicButton>
                      </form>
                    </Form>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/30 dark:border-white/20" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white/20 dark:bg-white/10 backdrop-blur-sm px-3 text-gray-600 dark:text-gray-400 rounded-lg">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <DynamicButton
                        variant="outline"
                        onClick={() => void handleSocialSignIn('google')}
                        disabled={isLoading}
                        className="h-10"
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        Google
                      </DynamicButton>
                      <DynamicButton
                        variant="outline"
                        onClick={() => void handleSocialSignIn('facebook')}
                        disabled={isLoading}
                        className="h-10"
                      >
                        <svg className="mr-2 h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                      </DynamicButton>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Footer */}
                <p className="text-center text-xs text-gray-600 dark:text-gray-400">
                  By clicking continue, you agree to our{' '}
                  <span className="underline underline-offset-4 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="underline underline-offset-4 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
                    Privacy Policy
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Firebase Debug Status (only in development) */}
      <FirebaseStatus />
    </div>
  )
}
