'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import { useTheme } from '@/context/theme-context'

type FooterSettingsLS = {
  cookiesContent?: string | null
  cookiesContentBn?: string | null
}

const defaultEnglish = `Cookies Policy

This Cookies Policy explains how Tripfeels uses cookies and similar technologies on tripfeels.com (the “Site”). By using the Site, you consent to the use of cookies in accordance with this policy.

What Are Cookies?
Cookies are small text files stored on your device by websites you visit. They help websites function properly, improve user experience, and provide information to site owners.

How We Use Cookies
• Essential Cookies: Necessary for site functionality (e.g., authentication, security).
• Performance Cookies: Help us analyze site usage and improve performance.
• Functional Cookies: Remember your preferences and settings.
• Advertising/Analytics Cookies: Used to deliver relevant content and measure effectiveness (e.g., Google Analytics).

Managing Cookies
You can manage or disable cookies in your browser settings. Note that disabling some cookies may affect site functionality. Learn more at www.allaboutcookies.org.

Third-Party Cookies
We may use third-party services that set their own cookies (e.g., Google Analytics). For details on how Google uses your information, visit: https://www.google.com/intl/en/policies/privacy/ and to opt out: https://tools.google.com/dlpage/gaoptout.

Updates To This Policy
We may update this policy periodically. Changes will be posted on this page with an updated date.

Contact
For questions about this Cookies Policy, contact: tripfeelsbd@gmail.com`

const defaultBangla = `কুকিজ নীতি (Cookies Policy)

এই নীতিতে Tripfeels কীভাবে tripfeels.com (“সাইট”) এ কুকিজ ও অনুরূপ প্রযুক্তি ব্যবহার করে তা ব্যাখ্যা করা হয়েছে। সাইটটি ব্যবহার করলে আপনি এই নীতিতে বর্ণিত কুকিজ ব্যবহারে সম্মতি দিচ্ছেন।

কুকিজ কী?
কুকিজ হলো ছোট টেক্সট ফাইল যা আপনার ডিভাইসে সংরক্ষিত হয়। এগুলো সাইটকে সঠিকভাবে কাজ করতে, ব্যবহারকারীর অভিজ্ঞতা উন্নত করতে এবং সাইট মালিককে তথ্য প্রদান করতে সহায়তা করে।

আমরা কীভাবে কুকিজ ব্যবহার করি
• প্রয়োজনীয় কুকিজ: প্রমাণীকরণ, নিরাপত্তা ইত্যাদির জন্য দরকার।
• পারফরম্যান্স কুকিজ: সাইটের ব্যবহার বিশ্লেষণ ও পারফরম্যান্স উন্নত করতে।
• ফাংশনাল কুকিজ: আপনার পছন্দ ও সেটিংস মনে রাখতে।
• বিজ্ঞাপন/অ্যানালিটিক্স কুকিজ: প্রাসঙ্গিক কন্টেন্ট প্রদর্শন ও কার্যকারিতা মাপতে (যেমন Google Analytics)।

কুকিজ নিয়ন্ত্রণ
আপনি ব্রাউজারের সেটিংস থেকে কুকিজ নিয়ন্ত্রণ বা নিষ্ক্রিয় করতে পারেন। তবে কিছু কুকিজ বন্ধ করলে সাইটের কিছু ফিচার সঠিকভাবে কাজ নাও করতে পারে। বিস্তারিত: www.allaboutcookies.org

থার্ড-পার্টি কুকিজ
আমরা তৃতীয় পক্ষের সেবা ব্যবহার করতে পারি, যারা নিজেদের কুকিজ সেট করে (যেমন Google Analytics)। Google কীভাবে তথ্য ব্যবহার করে: https://www.google.com/intl/en/policies/privacy/ এবং অপ্ট-আউট: https://tools.google.com/dlpage/gaoptout

নীতির হালনাগাদ
সময় অনুযায়ী এই নীতি হালনাগাদ হতে পারে। যে কোনো পরিবর্তন এই পাতায় আপডেটেড তারিখসহ প্রকাশ করা হবে।

যোগাযোগ
প্রশ্ন থাকলে ইমেইল করুন: tripfeelsbd@gmail.com`

export default function CookiesPage() {
  const [tab, setTab] = useState<'en' | 'bn'>('en')
  const [ls, setLs] = useState<FooterSettingsLS | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const { gradientFrom, gradientVia, gradientTo } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tripfeels-footer-settings')
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          const obj = parsed as Record<string, unknown>
          const cc = obj.cookiesContent
          const ccbn = obj.cookiesContentBn
          const next: FooterSettingsLS = {}
          if (typeof cc === 'string' || cc === null) next.cookiesContent = cc
          if (typeof ccbn === 'string' || ccbn === null) next.cookiesContentBn = ccbn
          setLs(next)
        }
      }
    } catch (e) {
      void e
    }
    setMounted(true)
  }, [])

  const english = useMemo(() => ls?.cookiesContent ?? defaultEnglish, [ls])
  const bangla = useMemo(() => ls?.cookiesContentBn ?? defaultBangla, [ls])

  const wrapper = useMemo(() => {
    return {
      className: 'min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
      style: {} as React.CSSProperties,
    }
  }, [])

  const toRgba = (hex: string, alpha: number) => {
    if (!hex) return `rgba(0,0,0,${alpha})`
    if (hex.startsWith('rgb'))
      return hex.replace(
        /rgba?\(([^)]+)\)/,
        (_m: string, inner: string) => `rgba(${inner.split(',').slice(0, 3).join(',')}, ${alpha})`,
      )
    const h = hex.replace('#', '')
    const bigint = parseInt(h, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return (
    <AuthSessionProvider>
      <div className={wrapper.className} style={wrapper.style}>
        {mounted && (
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute -top-40 -right-32 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"
              style={{ backgroundColor: toRgba(gradientFrom, 0.3) }}
            />
            <div
              className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"
              style={{ backgroundColor: toRgba(gradientTo, 0.3) }}
            />
            <div
              className="absolute top-40 left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-4000"
              style={{ backgroundColor: toRgba(gradientVia, 0.3) }}
            />
          </div>
        )}

        <Header
          showNavigation={false}
          showUserActions={true}
          onMobileMenuToggle={() => undefined}
        />

        <div className="flex relative z-10 h-screen">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <div className="fixed top-14 bottom-0 left-0 z-30">
              <Sidebar onCollapseChange={setIsSidebarCollapsed} className="h-full" />
            </div>
          </div>
          {/* Sidebar spacer */}
          <div className={`hidden md:block ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}></div>

          {/* Content */}
          <main className="flex-1 overflow-auto p-6 pt-24 pb-20">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Hero banner */}
              <div className="relative overflow-hidden rounded-2xl border border-white/30 dark:border-white/20 bg-white/20 dark:bg-white/10 p-8 md:p-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
                  Cookies Policy
                </h1>
                <p className="mt-3 text-sm text-gray-700/80 dark:text-gray-300/80">
                  <Link href="/" className="hover:underline">
                    Home
                  </Link>{' '}
                  • Cookies Policy
                </p>
                {/* Decorative shapes */}
                {mounted && (
                  <div className="pointer-events-none absolute inset-0 -z-0">
                    <div
                      className="absolute -top-10 -left-10 w-40 h-40 rotate-45 rounded-lg"
                      style={{ backgroundColor: toRgba(gradientFrom, 0.2) }}
                    />
                    <div
                      className="absolute -bottom-10 right-10 w-44 h-44 -rotate-45 rounded-lg"
                      style={{ backgroundColor: toRgba(gradientTo, 0.2) }}
                    />
                  </div>
                )}
              </div>

              {/* Content grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left side nav */}
                <aside className="md:col-span-3">
                  <div className="rounded-xl border border-white/30 dark:border-white/20 bg-white/20 dark:bg-white/10 p-4">
                    <nav className="space-y-1 text-sm">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Policies
                      </div>
                      <a
                        href="/privacy"
                        className="block rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-white/20"
                      >
                        Privacy Policy
                      </a>
                      <a className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/30 dark:bg-white/20 text-gray-900 dark:text-gray-100">
                        <span>Cookies Policy</span>
                      </a>
                      <a
                        href="/terms"
                        className="block rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-white/20"
                      >
                        Terms & Conditions
                      </a>
                    </nav>
                    <div className="mt-4 inline-flex rounded-lg border border-white/30 dark:border-white/20 bg-white/10 overflow-hidden">
                      <button
                        className={`px-3 py-1.5 text-xs ${tab === 'en' ? 'bg-white/30 dark:bg-white/20 text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}
                        onClick={() => setTab('en')}
                      >
                        English
                      </button>
                      <button
                        className={`px-3 py-1.5 text-xs ${tab === 'bn' ? 'bg-white/30 dark:bg-white/20 text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}
                        onClick={() => setTab('bn')}
                      >
                        বাংলা
                      </button>
                    </div>
                  </div>
                </aside>

                {/* Right content */}
                <section className="md:col-span-9">
                  <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/20 rounded-xl p-6 md:p-8 shadow-lg">
                    {(() => {
                      const content = tab === 'en' ? english : bangla
                      const parts = String(content).split('\n')
                      const first = String(parts[0] ?? '').trim()
                      const isTitle =
                        first.length > 0 &&
                        (tab === 'en' ? /cookies/i.test(first) : /কুকিজ|Cookies/.test(first))
                      const body = isTitle ? parts.slice(1).join('\n') : String(content)
                      const title = isTitle
                        ? first
                        : tab === 'en'
                          ? 'Cookies Policy'
                          : 'কুকিজ নীতি (Cookies Policy)'
                      return (
                        <>
                          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-3">
                            {title}
                          </h2>
                          <article className="whitespace-pre-wrap leading-7 text-[13.5px] md:text-[14px] text-gray-800 dark:text-gray-200">
                            {body}
                          </article>
                        </>
                      )
                    })()}
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>

        <div
          className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-64'}`}
        >
          <Footer />
        </div>
      </div>
    </AuthSessionProvider>
  )
}
