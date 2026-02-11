'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import { Skeleton } from '@/components/ui/skeleton-loading'
import { useTheme } from '@/context/theme-context'

type FooterSettingsLS = {
  privacyContent?: string | null
  privacyContentBn?: string | null
}

const defaultEnglish = `Privacy Policy
Last updated: October 12, 2025
This Privacy Policy describes how Tripfeels (“we”, “our”, or “us”) collects, uses, and shares your personal information when you visit or make a purchase from tripfeels.com (the “Site”).
By using our Site, you agree to the terms outlined in this Privacy Policy. Please read it carefully to understand how we handle your information.

1. Personal Information We Collect
When you visit the Site, we automatically collect certain information about your device and how you interact with our website.
This includes:
Your IP address, web browser type, and time zone
Details about cookies installed on your device
Pages or products you view
Referring websites or search terms
Information about your browsing behavior
We refer to this as “Device Information.”
We collect Device Information using:
Cookies: Small data files stored on your device. Learn more and manage cookies at www.allaboutcookies.org.
Log Files: Track actions on the Site (e.g., IP, browser type, ISP, referring/exit pages, timestamps).
Web Beacons, Tags, and Pixels: Electronic files that monitor browsing activity.
If you make a purchase or attempt to make a purchase through the Site, we collect additional Order Information, including:
Your name, billing address, shipping address, and contact information
Payment information (such as credit/debit card or PayPal)
Email address and phone number
This is referred to as “Order Information.”

2. How We Use Your Personal Information
We use your personal information to:
Process and fulfill your orders
Communicate with you regarding your purchase or inquiry
Detect and prevent fraud or security issues
Improve our website, marketing, and customer experience
Provide personalized recommendations and advertising
Comply with applicable legal obligations
Additionally, when consistent with your preferences, we may use your information to send promotional updates or special offers related to our products and services.

3. Sharing Your Personal Information
We may share your information with third-party partners and service providers that help us operate our business, such as:
Payment processors (to handle secure transactions)
Shipping companies (to deliver your orders)
Analytics providers (like Google Analytics)
You can read more about how Google uses your Personal Information here:
https://www.google.com/intl/en/policies/privacy/
To opt out of Google Analytics tracking, visit:
https://tools.google.com/dlpage/gaoptout.
We may also disclose your information:
To comply with legal obligations or government requests
To enforce our site policies or protect our rights, property, or safety

4. Behavioral Advertising
We use your personal information to deliver relevant advertisements or marketing messages.
You can opt out of targeted advertising by visiting the Digital Advertising Alliance’s opt-out portal:
http://optout.aboutads.info/

5. Your Rights
Under GDPR (for EU/EEA Users):
If you are a resident of the European Economic Area (EEA), you have the following rights:
Access: Request a copy of your personal data.
Correction: Request correction of inaccurate or incomplete data.
Erasure (“Right to be Forgotten”): Request deletion of your data.
Restriction: Request restriction of data processing.
Portability: Request your data in a structured, machine-readable format.
Objection: Object to certain processing activities (like marketing).
To exercise any of these rights, please contact us at tripfeelsbd@gmail.com.
We process your data to fulfill contracts (e.g., an order), or otherwise pursue legitimate business interests listed above.

Under CCPA (for California Residents):
If you are a California resident, you have the right to:
Know what personal information we collect, use, and share.
Request deletion of your personal information.
Opt out of the sale of your personal information (we do not sell user data).
Non-discrimination for exercising your privacy rights.
To make a CCPA request, please contact us at tripfeelsbd@gmail.com.

6. Do Not Track
Please note that we do not change our Site’s data collection and use practices when we detect a Do Not Track signal from your browser.

7. Data Retention
We retain Order Information for as long as necessary to provide our services or comply with legal, accounting, or reporting requirements.
You may request deletion of your data at any time by contacting tripfeelsbd@gmail.com.

8. Security
We take reasonable technical and organizational measures to protect your personal data from unauthorized access, disclosure, alteration, or destruction. However, no method of online transmission or storage is 100% secure.

9. Third-Party Tools and Links
Our Site may provide access to third-party tools or services we do not control.
Your use of these tools is entirely at your own risk and discretion. We encourage you to review their respective privacy policies before use.

10. Changes to This Policy
We may update this Privacy Policy periodically to reflect operational, legal, or regulatory changes.
Any updates will be posted on this page with a revised “Last Updated” date.

11. Contact Us
If you have questions, requests, or complaints about our privacy practices, please contact us:
📧 Email: tripfeelsbd@gmail.com
🌐 Website: tripfeels.com`

const defaultBangla = `গোপনীয়তা নীতি (Privacy Policy)
সর্বশেষ হালনাগাদ: ১২ অক্টোবর, ২০২৫
এই গোপনীয়তা নীতি ব্যাখ্যা করে কিভাবে Tripfeels (“আমরা”, “আমাদের”) আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার এবং শেয়ার করে যখন আপনি tripfeels.com (“সাইট”) ভিজিট করেন বা কোনো বুকিং/কেনাকাটা করেন।
সাইটটি ব্যবহারের মাধ্যমে আপনি এই গোপনীয়তা নীতির শর্তাবলীতে সম্মতি দিচ্ছেন। অনুগ্রহ করে এটি মনোযোগ দিয়ে পড়ুন।

১. আমরা কোন তথ্য সংগ্রহ করি
আপনি যখন আমাদের সাইটে প্রবেশ করেন, তখন আমরা স্বয়ংক্রিয়ভাবে আপনার ডিভাইস সম্পর্কিত কিছু তথ্য সংগ্রহ করি, যেমন:
আপনার আইপি (IP) ঠিকানা, ওয়েব ব্রাউজার, এবং টাইম জোন
আপনার ডিভাইসে ইনস্টল করা কুকিজ সম্পর্কিত তথ্য
আপনি কোন ওয়েব পৃষ্ঠা বা প্রোডাক্ট দেখেছেন
কোন ওয়েবসাইট বা সার্চ টার্ম থেকে আপনি আমাদের সাইটে এসেছেন
আপনি কীভাবে আমাদের সাইটের সঙ্গে ইন্টারঅ্যাক্ট করেন
এই তথ্যগুলোকে আমরা বলি “ডিভাইস তথ্য” (Device Information)।
আমরা এই তথ্যগুলো সংগ্রহ করি নিম্নলিখিত প্রযুক্তি ব্যবহার করে:
Cookies: আপনার ডিভাইসে সংরক্ষিত ছোট ডেটা ফাইল। বিস্তারিত জানতে ও কুকিজ বন্ধ করতে www.allaboutcookies.org ভিজিট করুন।
Log Files: সাইটে আপনার কার্যকলাপ ট্র্যাক করে (যেমন IP ঠিকানা, ব্রাউজার টাইপ, ইন্টারনেট সার্ভিস প্রোভাইডার, রেফারিং/এক্সিট পেজ, টাইম স্ট্যাম্প ইত্যাদি)।
Web Beacons, Tags, Pixels: আপনার ব্রাউজিং আচরণ বোঝার জন্য ব্যবহৃত ইলেকট্রনিক ফাইল।
যদি আপনি সাইটে কোনো অর্ডার করেন বা করার চেষ্টা করেন, আমরা অতিরিক্ত অর্ডার তথ্য (Order Information) সংগ্রহ করি, যেমন: নাম, বিলিং ও শিপিং ঠিকানা, যোগাযোগের তথ্য (ইমেইল, ফোন), পেমেন্ট তথ্য (যেমন ক্রেডিট/ডেবিট কার্ড, PayPal ইত্যাদি)।

২. আমরা আপনার তথ্য কীভাবে ব্যবহার করি
আমরা আপনার ব্যক্তিগত তথ্য নিম্নলিখিত উদ্দেশ্যে ব্যবহার করি: আপনার অর্ডার প্রক্রিয়া করা, আপনার সঙ্গে যোগাযোগ রক্ষা করা, প্রতারণা বা নিরাপত্তা ঝুঁকি শনাক্ত ও প্রতিরোধ করা, আমাদের ওয়েবসাইট/মার্কেটিং/ব্যবহারকারীর অভিজ্ঞতা উন্নত করা, প্রোমোশন বা অফার পাঠানো, এবং আইনগত বাধ্যবাধকতা পূরণ করা।

৩. আমরা কার সঙ্গে আপনার তথ্য শেয়ার করি
আমরা নির্ভরযোগ্য তৃতীয় পক্ষের সঙ্গে তথ্য শেয়ার করতে পারি (যেমন পেমেন্ট প্রসেসর, ডেলিভারি কোম্পানি, Google Analytics)। Google কিভাবে তথ্য ব্যবহার করে: https://www.google.com/intl/en/policies/privacy/ । Google Analytics থেকে অপ্ট-আউট: https://tools.google.com/dlpage/gaoptout
আইনগত বাধ্যবাধকতা অনুযায়ী প্রয়োজনে সরকারি সংস্থা/আদালত/আইন প্রয়োগকারীকে তথ্য প্রদান করা হতে পারে।

৪. বিজ্ঞাপন ও মার্কেটিং (Behavioral Advertising)
লক্ষ্যভিত্তিক বিজ্ঞাপনের জন্য আপনার তথ্য ব্যবহার করা হতে পারে। অপ্ট-আউট: http://optout.aboutads.info/

৫. আপনার অধিকারসমূহ
GDPR অনুযায়ী: অ্যাক্সেস, সংশোধন, মুছে ফেলা, সীমাবদ্ধতা, পোর্টেবিলিটি, আপত্তি — ইমেইল করুন: tripfeelsbd@gmail.com
CCPA অনুযায়ী: জানতে পারবেন আমরা কোন তথ্য সংগ্রহ/ব্যবহার করছি, মুছে ফেলার অনুরোধ করতে পারবেন, বিক্রয় নিষিদ্ধ করতে পারবেন (আমরা তথ্য বিক্রি করি না), এবং কোনো বৈষম্য হবেন না।

৬. “Do Not Track” সিগন্যাল
বর্তমানে “Do Not Track” সিগন্যাল প্রাপ্ত হলে নীতিতে কোনো পরিবর্তন করা হয় না।

৭. তথ্য সংরক্ষণ (Data Retention)
অর্ডার সম্পর্কিত তথ্য প্রয়োজন অনুসারে সংরক্ষিত হয়। মুছে ফেলার অনুরোধ: tripfeelsbd@gmail.com

৮. নিরাপত্তা (Security)
দরকারি প্রযুক্তিগত/প্রশাসনিক ব্যবস্থা নেওয়া হলেও অনলাইন/ইলেকট্রনিক সংরক্ষণ ১০০% নিরাপদ নয়।

৯. তৃতীয় পক্ষের লিংক ও টুলস
তৃতীয় পক্ষের টুল/লিংক ব্যবহারে ঝুঁকি আপনার; তাদের নীতি পড়ে নিন।

১০. নীতিমালার পরিবর্তন
সময় অনুযায়ী পরিবর্তন হতে পারে; এই পাতায় আপডেট তারিখসহ প্রকাশ করা হবে।

১১. আমাদের সাথে যোগাযোগ করুন
📧 ইমেইল: tripfeelsbd@gmail.com  |  🌐 ওয়েবসাইট: tripfeels.com`

export default function PrivacyPage() {
  const [tab, setTab] = useState<'en' | 'bn'>('en')
  const [ls, setLs] = useState<FooterSettingsLS | null>(null)
  const [_isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
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
          const pc = obj.privacyContent
          const pcbn = obj.privacyContentBn
          const next: FooterSettingsLS = {}
          if (typeof pc === 'string' || pc === null) next.privacyContent = pc
          if (typeof pcbn === 'string' || pcbn === null) next.privacyContentBn = pcbn
          setLs(next)
        }
      }
    } catch (e) {
      void e
    }
    setMounted(true)
  }, [])

  const english = useMemo(() => ls?.privacyContent ?? defaultEnglish, [ls])
  const bangla = useMemo(() => ls?.privacyContentBn ?? defaultBangla, [ls])

  const wrapper = useMemo(() => {
    return {
      className: 'min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
      style: {} as React.CSSProperties,
    }
  }, [])

  const toRgba = (hex: string, alpha: number) => {
    if (!hex) return `rgba(0,0,0,${alpha})`
    if (hex.startsWith('rgb')) {
      return hex.replace(
        /rgba?\(([^)]+)\)/,
        (_m: string, inner: string) => `rgba(${inner.split(',').slice(0, 3).join(',')}, ${alpha})`,
      )
    }
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
          onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
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
                  Privacy Policy
                </h1>
                <p className="mt-3 text-sm text-gray-700/80 dark:text-gray-300/80">
                  <Link href="/" className="hover:underline">
                    Home
                  </Link>{' '}
                  • Privacy Policy
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
                      <a className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/30 dark:bg-white/20 text-gray-900 dark:text-gray-100">
                        <span>Privacy Policy</span>
                      </a>
                      <a
                        href="/cookies"
                        className="block rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-white/20"
                      >
                        Cookies Policy
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
                    {!mounted ? (
                      <>
                        <Skeleton className="h-6 w-48 mb-4" />
                        <div className="space-y-3">
                          {Array.from({ length: 10 }, (_, i) => i).map((i) => (
                            <Skeleton
                              key={i}
                              className={`h-4 ${i % 3 === 0 ? 'w-5/6' : i % 3 === 1 ? 'w-4/6' : 'w-full'}`}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      (() => {
                        const content = tab === 'en' ? english : bangla
                        const parts = content.split('\n')
                        const first = parts[0]?.trim() || ''
                        const isTitle =
                          first.length > 0 &&
                          (tab === 'en'
                            ? /privacy policy/i.test(first)
                            : /গোপনীয়তা|Privacy Policy/.test(first))
                        const body = isTitle ? parts.slice(1).join('\n') : content
                        const title = isTitle
                          ? first
                          : tab === 'en'
                            ? 'Privacy Policy'
                            : 'গোপনীয়তা নীতি (Privacy Policy)'
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
                      })()
                    )}
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
