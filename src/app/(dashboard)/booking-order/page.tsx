'use client'

import confetti from 'canvas-confetti'
import { format } from 'date-fns'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { Plane, Loader2, Printer, RefreshCw, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { getAirportCity } from '@/lib/flight/utils/airport-city-lookup'
import type { OrderCreateApiResponse, OrderCreateResponse } from '@/types/flight/api/order.types'

const STORAGE_KEY = 'orderCreateResponse'

function formatFlightTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatFlightDate(iso: string): string {
  try {
    return format(new Date(iso), 'd MMM yyyy')
  } catch {
    return iso
  }
}

function formatBirthdate(iso: string): string {
  try {
    return format(new Date(iso), 'd MMM yyyy')
  } catch {
    return iso
  }
}

function formatExpiry(iso: string): string {
  try {
    return format(new Date(iso), 'd MMM yyyy')
  } catch {
    return iso
  }
}

/** Format paymentTimeLimit for display. Use "today" or "tomorrow" when expiry is that day. */
function formatPaymentTimeLimitMessage(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const expiryDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const timeStr = format(d, 'HH:mm')
    if (expiryDate.getTime() === today.getTime()) {
      return `Your booking will expire today at ${timeStr}.`
    }
    if (expiryDate.getTime() === tomorrow.getTime()) {
      return `Your booking will expire tomorrow at ${timeStr}.`
    }
    const dateStr = format(d, 'd MMMM')
    return `Your booking will expire by ${dateStr}, ${timeStr}.`
  } catch {
    return ''
  }
}

function isPaymentTimeLimitPast(iso: string): boolean {
  try {
    return new Date(iso).getTime() < Date.now()
  } catch {
    return false
  }
}

/** Format OrderCreate respondedOn for "Created on" (e.g. "29 Jan 2026, 20:24"). */
function formatCreatedOn(iso: string): string {
  try {
    return format(new Date(iso), 'd MMM yyyy, HH:mm')
  } catch {
    return iso
  }
}

function normalizeOrderStatus(status?: string): string {
  return status?.trim().toLowerCase() ?? ''
}

function isProcessingStatus(status?: string): boolean {
  const normalized = normalizeOrderStatus(status)
  return normalized === 'pending' || normalized === 'inprogress'
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-neutral-950 p-3 sm:p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`${GeistSans.className} text-[10px] font-medium uppercase tracking-wide leading-tight text-gray-500 dark:text-gray-400 ${className}`.trim()}
    >
      {children}
    </div>
  )
}

function fireConfetti() {
  const count = 200
  const defaults = { origin: { y: 0.7 }, zIndex: 9999 }
  const fire = (particleRatio: number, opts: confetti.Options) => {
    void confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) })
  }
  fire(0.25, { spread: 26, startVelocity: 55 })
  fire(0.2, { spread: 60 })
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
  fire(0.1, { spread: 120, startVelocity: 45 })
}

export default function BookingOrderPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderRef = searchParams.get('orderRef')
  const fromCreate = searchParams.get('success') === '1'
  const [order, setOrder] = useState<OrderCreateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<'confirm' | 'cancel' | null>(null)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false)
  const [cancelErrorMessage, setCancelErrorMessage] = useState<string | null>(null)
  type ActionConfirmType = 'orderConfirm' | 'refund' | 'changeFlight'
  const [actionConfirmModal, setActionConfirmModal] = useState<ActionConfirmType | null>(null)
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)
  type ConfirmStep =
    | 'preparing'
    | 'revalidating'
    | 'confirming'
    | 'finalizing'
    | 'fareUpdateRequired'
    | 'success'
    | 'error'
  const [confirmStep, setConfirmStep] = useState<ConfirmStep>('preparing')
  const [confirmErrorMessage, setConfirmErrorMessage] = useState<string | null>(null)
  const [reshopResponse, setReshopResponse] = useState<OrderCreateApiResponse | null>(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const successPopupShownRef = useRef(false)
  const bookingSyncRef = useRef<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

  const clearSuccessFlagFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (!url.searchParams.has('success')) return
    url.searchParams.delete('success')
    router.replace(url.pathname + url.search)
  }, [router])

  const loadOrder = useCallback(async () => {
    if (!orderRef) {
      setError('Order reference is missing')
      setLoading(false)
      return
    }

    console.log('Loading order for orderRef:', orderRef)
    setLoading(true)
    try {
      // Status check: always call OrderRetrieve to get current orderStatus and paymentTimeLimit (e.g. extended booking time)
      const res = await fetch('/api/flight/orderretrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderReference: orderRef }),
      })
      const data = (await res.json()) as OrderCreateApiResponse & {
        Response?: OrderCreateApiResponse['response']
      }
      // Support both 'response' and 'Response' (some APIs use capital R)
      const orderData = data?.response ?? data?.Response
      if (data.success && orderData && typeof orderData === 'object') {
        setOrder(orderData)
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        } catch {
          // ignore quota errors
        }
        // orderStatus and paymentTimeLimit (including any backend extension) are now up to date
      } else {
        // Fallback: show cached order if API failed (e.g. network) so user can still view
        const stored = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as OrderCreateApiResponse & {
              Response?: OrderCreateApiResponse['response']
            }
            const cached = parsed?.response ?? parsed?.Response
            if (cached?.orderReference === orderRef) {
              setOrder(cached)
              setLoading(false)
              return
            }
          } catch {
            // ignore
          }
        }
        const err = data as {
          error?: { errorMessage?: unknown } | string
          errorMessage?: unknown
          message?: unknown
          details?: unknown
        }

        const apiErrorCandidates: Array<unknown> = [
          typeof err?.error === 'object' && err.error !== null
            ? (err.error as { errorMessage?: unknown }).errorMessage
            : null,
          err?.errorMessage,
          typeof err?.error === 'string' ? err.error : null,
          err?.message,
          err?.details,
        ]

        const apiError =
          apiErrorCandidates.find(
            (v): v is string => typeof v === 'string' && v.trim().length > 0,
          ) ?? null

        setError(apiError ?? 'Failed to load order')
      }
    } catch (e) {
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as OrderCreateApiResponse & {
            Response?: OrderCreateApiResponse['response']
          }
          const cached = parsed?.response ?? parsed?.Response
          if (cached?.orderReference === orderRef) {
            setOrder(cached)
            setLoading(false)
            return
          }
        } catch {
          // ignore
        }
      }
      const errMsg = e instanceof Error ? e.message : 'Failed to load order'
      setError(
        errMsg.includes('fetch') || errMsg.includes('Failed to fetch')
          ? 'Unable to reach the booking API. Please check your connection and try again.'
          : errMsg,
      )
    } finally {
      setLoading(false)
    }
  }, [orderRef])

  const handleRefresh = useCallback(async () => {
    if (!orderRef) return
    setRefreshLoading(true)
    setError(null)
    try {
      await loadOrder()
    } finally {
      setRefreshLoading(false)
    }
  }, [orderRef, loadOrder])

  useEffect(() => {
    // Call loadOrder on mount when orderRef is available
    if (orderRef) {
      void loadOrder()
    }
  }, [orderRef]) // Only depend on orderRef to prevent infinite loops

  // For instant purchase (Web fare), auto-refresh while supplier confirmation is processing.
  useEffect(() => {
    if (!orderRef || !order) return
    const fareType = (order.orderItem?.[0]?.fareType ?? '').toLowerCase()
    const shouldPoll = fareType === 'web' && isProcessingStatus(order.orderStatus)
    if (!shouldPoll) return

    const timer = window.setTimeout(() => {
      void loadOrder()
    }, 15000)

    return () => window.clearTimeout(timer)
  }, [orderRef, order, loadOrder])

  // Ensure booking history record exists even if the create-page save was interrupted.
  useEffect(() => {
    if (!orderRef || !order) return
    if (bookingSyncRef.current === orderRef) return
    bookingSyncRef.current = orderRef

    const payload = {
      orderResponse: {
        response: order,
        respondedOn: new Date().toISOString(),
      },
      createdBy: session?.user?.email || 'Guest',
    }

    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.warn('Booking sync from booking-order failed:', err)
    })
  }, [orderRef, order, session?.user?.email])

  // Show success popup + confetti when arriving from review-book after OrderCreate
  useEffect(() => {
    if (fromCreate && order && !loading && !successPopupShownRef.current) {
      successPopupShownRef.current = true
      const status = normalizeOrderStatus(order.orderStatus)
      const isCreateSuccessState = status === 'onhold' || status === 'confirmed'
      if (isCreateSuccessState) {
        setShowSuccessPopup(true)
        fireConfetti()
      } else {
        clearSuccessFlagFromUrl()
      }
    }
  }, [fromCreate, order, loading, clearSuccessFlagFromUrl])

  const closeSuccessPopup = useCallback(() => {
    setShowSuccessPopup(false)
    // Remove success param from URL so refresh won't show popup again
    clearSuccessFlagFromUrl()
  }, [clearSuccessFlagFromUrl])

  const handlePrint = useCallback(() => {
    if (typeof window === 'undefined' || !printRef.current) return
    const prevTitle = document.title
    document.title = `Ticket - ${order?.orderReference ?? 'Booking'}`
    window.print()
    document.title = prevTitle
  }, [order?.orderReference])

  const handleOrderConfirm = useCallback(async () => {
    if (!orderRef || !order) return
    setShowConfirmPopup(true)
    setConfirmStep('preparing')
    setConfirmErrorMessage(null)
    setReshopResponse(null)
    setActionLoading('confirm')

    await delay(1000)
    setConfirmStep('revalidating')
    let reshop: OrderCreateApiResponse
    try {
      const res = await fetch('/api/flight/orderreshopprice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderReference: orderRef }),
      })
      reshop = (await res.json()) as OrderCreateApiResponse
    } catch (e) {
      setConfirmStep('error')
      setConfirmErrorMessage(e instanceof Error ? e.message : 'Failed to revalidate fare')
      setActionLoading(null)
      return
    }
    if (!reshop.success || !reshop.response) {
      setConfirmStep('error')
      setConfirmErrorMessage(
        (reshop as { error?: { errorMessage?: string } }).error?.errorMessage ??
          'Failed to revalidate fare',
      )
      setActionLoading(null)
      return
    }
    await delay(1000)
    setConfirmStep('confirming')
    await delay(1000)

    const bookedTotal = order.orderItem?.[0]?.price?.totalPayable?.total ?? 0
    const newTotal = reshop.response.orderItem?.[0]?.price?.totalPayable?.total ?? 0
    const hasFareChange =
      newTotal !== bookedTotal ||
      (reshop.response.orderChangeInfo != null && reshop.response.orderChangeInfo !== undefined)

    if (hasFareChange) {
      setReshopResponse(reshop)
      setConfirmStep('fareUpdateRequired')
      setActionLoading(null)
      return
    }

    setConfirmStep('finalizing')
    await delay(1000)
    try {
      const res = await fetch('/api/flight/orderconfirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderReference: orderRef }),
      })
      const data = (await res.json()) as { success?: boolean; error?: { errorMessage?: string } }
      if (!data.success) {
        setConfirmStep('error')
        setConfirmErrorMessage(data.error?.errorMessage ?? 'Failed to confirm order')
        setActionLoading(null)
        return
      }
    } catch (e) {
      setConfirmStep('error')
      setConfirmErrorMessage(e instanceof Error ? e.message : 'Failed to confirm order')
      setActionLoading(null)
      return
    }
    setConfirmStep('success')
    fireConfetti()
    await loadOrder()
    setActionLoading(null)
    await delay(2000)
    setShowConfirmPopup(false)
    setConfirmStep('preparing')
  }, [orderRef, order, loadOrder])

  const handleFareUpdateCancel = useCallback(() => {
    if (reshopResponse?.response) {
      setOrder(reshopResponse.response)
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(reshopResponse))
      } catch {
        // ignore
      }
    }
    setShowConfirmPopup(false)
    setReshopResponse(null)
    setConfirmStep('preparing')
  }, [reshopResponse])

  const handleConfirmUpdatedFare = useCallback(async () => {
    if (!orderRef) return
    setConfirmStep('finalizing')
    setActionLoading('confirm')
    await delay(1000)
    try {
      const res = await fetch('/api/flight/orderconfirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderReference: orderRef }),
      })
      const data = (await res.json()) as { success?: boolean; error?: { errorMessage?: string } }
      if (!data.success) {
        setConfirmStep('error')
        setConfirmErrorMessage(data.error?.errorMessage ?? 'Failed to confirm order')
        setActionLoading(null)
        return
      }
    } catch (e) {
      setConfirmStep('error')
      setConfirmErrorMessage(e instanceof Error ? e.message : 'Failed to confirm order')
      setActionLoading(null)
      return
    }
    setConfirmStep('success')
    fireConfetti()
    await loadOrder()
    setActionLoading(null)
    setReshopResponse(null)
    await delay(2000)
    setShowConfirmPopup(false)
    setConfirmStep('preparing')
  }, [orderRef, loadOrder])

  const closeConfirmPopup = useCallback(() => {
    setShowConfirmPopup(false)
    setConfirmStep('preparing')
    setConfirmErrorMessage(null)
    setReshopResponse(null)
    setActionLoading(null)
  }, [])

  const openCancelConfirmModal = useCallback(() => {
    setCancelErrorMessage(null)
    setShowCancelConfirmModal(true)
  }, [])

  const handleOrderCancelConfirm = useCallback(async () => {
    if (!orderRef || !order) return
    setActionLoading('cancel')
    setCancelErrorMessage(null)
    try {
      const res = await fetch('/api/flight/ordercancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderReference: orderRef }),
      })
      let data: { success?: boolean; error?: { errorMessage?: string } }
      try {
        data = (await res.json()) as { success?: boolean; error?: { errorMessage?: string } }
      } catch {
        setCancelErrorMessage('Failed to cancel order. Invalid response from server.')
        return
      }
      if (res.ok && data.success === true) {
        setShowCancelConfirmModal(false)
        try {
          sessionStorage.removeItem(`orderCreateTime_${orderRef}`)
        } catch {
          // ignore
        }
        await loadOrder()
      } else {
        setCancelErrorMessage(data.error?.errorMessage ?? 'Failed to cancel order')
      }
    } catch (e) {
      setCancelErrorMessage(e instanceof Error ? e.message : 'Failed to cancel order')
    } finally {
      setActionLoading(null)
    }
  }, [orderRef, order, loadOrder])

  const closeCancelModal = useCallback(() => {
    setShowCancelConfirmModal(false)
    setCancelErrorMessage(null)
  }, [])

  const openOrderConfirmModal = useCallback(() => setActionConfirmModal('orderConfirm'), [])
  const openRefundModal = useCallback(() => setActionConfirmModal('refund'), [])
  const openChangeFlightModal = useCallback(() => setActionConfirmModal('changeFlight'), [])
  const closeActionConfirmModal = useCallback(() => setActionConfirmModal(null), [])

  const handleActionConfirmProceed = useCallback(() => {
    const type = actionConfirmModal
    closeActionConfirmModal()
    if (type === 'orderConfirm') {
      void handleOrderConfirm()
    } else if (type === 'refund') {
      // TODO: Implement refund flow
    } else if (type === 'changeFlight') {
      // TODO: Implement change flight flow
    }
  }, [actionConfirmModal, closeActionConfirmModal, handleOrderConfirm])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <p className="font-medium text-red-800 dark:text-red-200">{error ?? 'Order not found'}</p>
        </div>
      </div>
    )
  }

  const firstItem = order.orderItem[0]
  const paxSegments = firstItem?.paxSegmentList ?? []
  const outboundSegments = paxSegments.filter((s) => !s.paxSegment.returnJourney)
  const returnSegments = paxSegments.filter((s) => s.paxSegment.returnJourney)
  const firstSegment = paxSegments[0]?.paxSegment
  const commonAirline = firstSegment?.marketingCarrierInfo?.carrierName ?? '-'
  const commonPNR = firstSegment?.airlinePNR ?? '-'
  const commonClass = firstSegment?.cabinType ?? 'Economy'
  const fareDetails = firstItem?.fareDetailList ?? []
  const price = firstItem?.price
  const baggageList = firstItem?.baggageAllowanceList ?? []
  const penalty = firstItem?.penalty
  const contact = order.contactDetail

  // Created on: from OrderCreate only (stored in sessionStorage by review-book)
  const createdOnRaw =
    typeof window !== 'undefined' && order
      ? sessionStorage.getItem(`orderCreateTime_${order.orderReference}`)
      : null
  const createdOn = createdOnRaw ? formatCreatedOn(createdOnRaw) : null

  // Airline PNR(s): can be multiple from orderItem[].paxSegmentList[].paxSegment.airlinePNR
  const airlinePNRs = Array.from(
    new Set(
      (order.orderItem ?? []).flatMap(
        (item) =>
          (item.paxSegmentList ?? [])
            .map((s) => s.paxSegment?.airlinePNR)
            .filter(Boolean) as string[],
      ),
    ),
  )
  const airlinePNRDisplay = airlinePNRs.length > 0 ? airlinePNRs.join(', ') : commonPNR

  const fareTypeLower = (firstItem?.fareType ?? '').toLowerCase()
  const isInstantFareType = fareTypeLower === 'web'

  const displayStatus =
    order.orderStatus === 'OnHold' &&
    order.paymentTimeLimit &&
    isPaymentTimeLimitPast(order.paymentTimeLimit)
      ? 'Expired'
      : order.orderStatus
  const displayStatusLower = normalizeOrderStatus(displayStatus)
  const rawOrderStatusLower = normalizeOrderStatus(order.orderStatus)
  const isPaymentProcessing = isProcessingStatus(displayStatus)
  const paymentStatus = displayStatusLower === 'confirmed' ? 'Paid' : isPaymentProcessing ? 'Processing' : 'Unpaid'
  const isInstantIssuing = isInstantFareType && isProcessingStatus(displayStatus)
  const isInstantIssueFailed =
    isInstantFareType &&
    (displayStatusLower === 'unknown' ||
      displayStatusLower === 'unconfirmed' ||
      displayStatusLower === 'un-confirmed')
  const isInstantIssued = isInstantFareType && displayStatusLower === 'confirmed'

  const createdByName = session?.user?.name ?? null

  const confirmStepLabel =
    confirmStep === 'preparing'
      ? 'Preparing…'
      : confirmStep === 'revalidating'
        ? 'Revalidating fare…'
        : confirmStep === 'confirming'
          ? 'Confirming price…'
          : confirmStep === 'finalizing'
            ? 'Finalizing booking…'
            : confirmStep === 'fareUpdateRequired'
              ? 'Price update notice'
              : confirmStep === 'success'
                ? 'Booking confirmed!'
                : confirmStep === 'error'
                  ? 'Error'
                  : ''

  const showSpinner =
    confirmStep === 'preparing' ||
    confirmStep === 'revalidating' ||
    confirmStep === 'confirming' ||
    confirmStep === 'finalizing'

  const previousFare = order?.orderItem?.[0]?.price?.totalPayable?.total ?? 0
  const latestFare = reshopResponse?.response?.orderItem?.[0]?.price?.totalPayable?.total ?? 0
  const fareCurrency =
    order?.orderItem?.[0]?.price?.totalPayable?.curreny ??
    reshopResponse?.response?.orderItem?.[0]?.price?.totalPayable?.curreny ??
    'BDT'
  const fareDiff = latestFare - previousFare
  const fareDiffFormatted =
    fareDiff >= 0 ? `+${fareDiff.toLocaleString()}` : String(fareDiff.toLocaleString())

  const isOrderConfirmed = rawOrderStatusLower === 'confirmed'
  const isOrderInProgress = rawOrderStatusLower === 'inprogress'
  const showRefundChangeFlight = isOrderConfirmed || isOrderInProgress
  const refundChangeFlightDisabled = isOrderInProgress || actionLoading !== null

  return (
    <div
      className={`min-h-screen bg-white dark:bg-black pt-2 pb-6 px-2 sm:px-4 print:bg-white print:py-0 print:px-0 ${GeistMono.className}`}
    >
      {/* Order confirmation – loading popup with steps */}
      {showConfirmPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-popup-title"
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-neutral-950 p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {confirmStep === 'fareUpdateRequired' ? (
              <>
                <h2
                  id="confirm-popup-title"
                  className={`${GeistSans.className} mb-2 text-lg font-bold text-gray-900 dark:text-white`}
                >
                  Fare Updated
                </h2>
                <p
                  className={`${GeistSans.className} mb-4 text-sm text-gray-600 dark:text-gray-400`}
                >
                  The fare has changed during verification.
                </p>
                <div
                  className={`${GeistSans.className} mb-4 space-y-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-sm`}
                >
                  <p className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Previous fare:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {fareCurrency} {previousFare.toLocaleString()}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Latest fare:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {fareCurrency} {latestFare.toLocaleString()}
                    </span>
                  </p>
                  <p className="flex justify-between border-t border-gray-200 pt-2 dark:border-white/10 dark:text-gray-300">
                    <span className="text-gray-600 dark:text-gray-400">Fare difference:</span>
                    <span className="font-semibold">{fareDiffFormatted}</span>
                  </p>
                </div>
                <p
                  className={`${GeistSans.className} mb-4 text-sm text-gray-600 dark:text-gray-400`}
                >
                  Please confirm to continue with the updated price.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
                  <button
                    type="button"
                    onClick={() => void handleConfirmUpdatedFare()}
                    className={`${GeistSans.className} rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90`}
                  >
                    Confirm Updated Fare
                  </button>
                  <button
                    type="button"
                    onClick={handleFareUpdateCancel}
                    className={`${GeistSans.className} rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-neutral-950 dark:text-gray-200 dark:hover:bg-gray-800`}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : confirmStep === 'success' ? (
              <div className="text-center py-2">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
                <p
                  className={`${GeistSans.className} mt-3 text-base font-semibold text-gray-900 dark:text-white`}
                >
                  Booking confirmed!
                </p>
              </div>
            ) : confirmStep === 'error' ? (
              <>
                <h2
                  id="confirm-popup-title"
                  className={`${GeistSans.className} mb-2 text-lg font-bold text-red-600 dark:text-red-400`}
                >
                  Error
                </h2>
                <p
                  className={`${GeistSans.className} mb-4 text-sm text-gray-600 dark:text-gray-400`}
                >
                  {confirmErrorMessage ?? 'Something went wrong.'}
                </p>
                <button
                  type="button"
                  onClick={closeConfirmPopup}
                  className={`${GeistSans.className} rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900`}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center justify-center py-2">
                  {showSpinner && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
                  <p
                    className={`${GeistSans.className} mt-3 text-sm font-medium text-gray-900 dark:text-white`}
                  >
                    {confirmStepLabel}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success popup after redirect from review-book (OrderCreate) */}
      {showSuccessPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-popup-title"
          onClick={closeSuccessPopup}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-neutral-950 p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center py-2">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600 dark:text-green-400" />
              <h2
                id="success-popup-title"
                className={`${GeistSans.className} mt-4 text-xl font-bold text-gray-900 dark:text-white`}
              >
                Booking Successful!
              </h2>
              <p className={`${GeistSans.className} mt-2 text-sm text-gray-600 dark:text-gray-400`}>
                Your flight has been booked. Order Reference:{' '}
                <span
                  className={`${GeistMono.className} font-semibold text-gray-900 dark:text-white`}
                >
                  {order?.orderReference ?? orderRef}
                </span>
              </p>
              <button
                type="button"
                onClick={closeSuccessPopup}
                className={`${GeistSans.className} mt-6 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200`}
              >
                View Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel order confirmation / error modal (replaces browser confirm/alert) */}
      {showCancelConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
          onClick={() => {
            if (actionLoading !== 'cancel') closeCancelModal()
          }}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-neutral-950 p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="cancel-modal-title"
              className={`${GeistSans.className} mb-3 text-base font-bold text-gray-900 dark:text-white`}
            >
              {cancelErrorMessage ? 'Error' : 'Cancel order?'}
            </h2>
            <p className={`${GeistSans.className} text-sm text-gray-600 dark:text-gray-400`}>
              {cancelErrorMessage ?? 'Cancel this order? This action may not be reversible.'}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
              {cancelErrorMessage ? (
                <button
                  type="button"
                  onClick={closeCancelModal}
                  className={`${GeistSans.className} rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200`}
                >
                  OK
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => void handleOrderCancelConfirm()}
                    disabled={actionLoading === 'cancel'}
                    className={`${GeistSans.className} inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none dark:border-red-500 dark:bg-red-500 dark:hover:bg-red-600`}
                  >
                    {actionLoading === 'cancel' ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : null}
                    Yes, cancel order
                  </button>
                  <button
                    type="button"
                    onClick={closeCancelModal}
                    disabled={actionLoading === 'cancel'}
                    className={`${GeistSans.className} rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none`}
                  >
                    Go back
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Confirm / Refund / Change Flight confirmation modal */}
      {actionConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="action-confirm-modal-title"
          onClick={closeActionConfirmModal}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-neutral-950 p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="action-confirm-modal-title"
              className={`${GeistSans.className} mb-3 text-base font-bold text-gray-900 dark:text-white`}
            >
              {actionConfirmModal === 'orderConfirm' && 'Confirm order?'}
              {actionConfirmModal === 'refund' && 'Request refund?'}
              {actionConfirmModal === 'changeFlight' && 'Change flight?'}
            </h2>
            <p className={`${GeistSans.className} text-sm text-gray-600 dark:text-gray-400`}>
              {actionConfirmModal === 'orderConfirm' &&
                'Confirm and pay for this booking? This will finalize your reservation.'}
              {actionConfirmModal === 'refund' &&
                'Request a refund for this booking? This action may not be reversible.'}
              {actionConfirmModal === 'changeFlight' &&
                'Change your flight? You will be redirected to select a new flight.'}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
              <button
                type="button"
                onClick={handleActionConfirmProceed}
                className={`${GeistSans.className} inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ${
                  actionConfirmModal === 'orderConfirm'
                    ? 'border border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                    : actionConfirmModal === 'refund'
                      ? 'border border-orange-600 bg-orange-600 text-white hover:bg-orange-700 dark:border-orange-500 dark:bg-orange-500'
                      : 'border border-gray-300 bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                }`}
              >
                {actionConfirmModal === 'orderConfirm' && 'Yes, confirm order'}
                {actionConfirmModal === 'refund' && 'Yes, request refund'}
                {actionConfirmModal === 'changeFlight' && 'Yes, change flight'}
              </button>
              <button
                type="button"
                onClick={closeActionConfirmModal}
                className={`${GeistSans.className} rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700`}
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={printRef} className="mx-auto w-full max-w-4xl print:max-w-none">
        {/* Two-column layout: main content (left) + Actions card in right column like Service Fee */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          <div className="flex-1 min-w-0 space-y-2 sm:space-y-4">
            {/* 1. Electronic Ticket */}
            <Card>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h1
                    className={`${GeistSans.className} text-lg sm:text-xl font-bold leading-tight text-gray-900 dark:text-white`}
                  >
                    Electronic Ticket
                  </h1>
                  <p
                    className={`${GeistSans.className} mt-0.5 text-sm leading-tight text-gray-600 dark:text-gray-400`}
                  >
                    Order Reference:{' '}
                    <span
                      className={`${GeistMono.className} font-semibold text-gray-900 dark:text-white`}
                    >
                      {order.orderReference}
                    </span>
                  </p>
                  <div
                    className={`${GeistSans.className} mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2`}
                  >
                    {createdOn && (
                      <div>
                        <Label className="mb-0">Created on</Label>
                        <p className="mt-0.5 font-medium leading-tight text-gray-900 dark:text-white">
                          {createdOn}
                        </p>
                      </div>
                    )}
                    {createdByName && (
                      <div>
                        <Label className="mb-0">Created by</Label>
                        <p className="mt-0.5 font-medium leading-tight text-gray-900 dark:text-white">
                          {createdByName}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="mb-0">Airline PNR</Label>
                      <p
                        className={`mt-0.5 font-medium leading-tight text-gray-900 dark:text-white ${GeistMono.className}`}
                      >
                        {airlinePNRDisplay}
                      </p>
                    </div>
                    <div>
                      <Label className="mb-0">Payment</Label>
                      <p className="mt-0.5 font-medium leading-tight text-gray-900 dark:text-white">
                        {paymentStatus}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0 sm:text-right">
                  <div className="flex items-center gap-2 sm:justify-end">
                    <Label>STATUS</Label>
                    <div className="rounded border border-gray-800 px-2.5 py-1 font-semibold text-sm text-gray-900 dark:border-gray-300 dark:text-white">
                      {displayStatus}
                    </div>
                  </div>
                  {order.orderStatus === 'OnHold' && order.paymentTimeLimit && (
                    <p
                      className={`${GeistSans.className} text-xs leading-tight text-gray-600 dark:text-gray-400`}
                    >
                      {isPaymentTimeLimitPast(order.paymentTimeLimit)
                        ? 'Your booking has expired.'
                        : formatPaymentTimeLimitMessage(order.paymentTimeLimit)}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {isInstantIssuing && (
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
                <p
                  className={`${GeistSans.className} text-sm font-medium text-amber-900 dark:text-amber-100`}
                >
                  Instant ticket issuance is in progress. This page auto-refreshes every 15 seconds
                  until the supplier returns a final status.
                </p>
              </Card>
            )}

            {isInstantIssueFailed && (
              <Card className="border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10">
                <p className={`${GeistSans.className} text-sm font-medium text-red-900 dark:text-red-100`}>
                  Instant ticket issuance was not completed. Please refresh and check status, or
                  contact support with order reference{' '}
                  <span className={GeistMono.className}>{order.orderReference}</span>.
                </p>
              </Card>
            )}

            {isInstantIssued && (
              <Card className="border-green-200 bg-green-50 dark:border-green-500/30 dark:bg-green-500/10">
                <p
                  className={`${GeistSans.className} text-sm font-medium text-green-900 dark:text-green-100`}
                >
                  Instant purchase completed. Your ticket is issued and confirmed.
                </p>
              </Card>
            )}

            {/* 2. Passenger Information */}
            <Card>
              <h2
                className={`${GeistSans.className} mb-1.5 text-base font-bold leading-tight text-gray-900 dark:text-white`}
              >
                Passenger Information
              </h2>
              <div className="space-y-2 sm:space-y-4">
                {order.paxList.map((pax, idx) => {
                  const ind = pax.individual
                  const fullName = [ind.givenName, ind.surname].filter(Boolean).join(' ')
                  const doc = ind.identityDoc
                  const ticketDoc = ind.ticketDocument
                  const ticketNum = Array.isArray(ticketDoc)
                    ? ticketDoc[0]?.ticketDocNbr
                    : (ticketDoc?.ticketDocNbr ?? ticketDoc?.ticketNumber)
                  const hasTicketNum =
                    ticketNum != null &&
                    String(ticketNum).trim() !== '' &&
                    String(ticketNum).trim() !== '-'
                  const hasNationality =
                    ind.nationality != null &&
                    String(ind.nationality).trim() !== '' &&
                    String(ind.nationality).trim() !== '-'
                  const docNumber = doc?.identityDocID
                  const hasDocNumber =
                    docNumber != null &&
                    String(docNumber).trim() !== '' &&
                    String(docNumber).trim() !== '-'
                  const expiryDate = doc?.expiryDate
                  const hasExpiryDate =
                    expiryDate != null &&
                    String(expiryDate).trim() !== '' &&
                    String(expiryDate).trim() !== '-'

                  const secondRowItems: { label: string; value: string }[] = []
                  if (hasNationality)
                    secondRowItems.push({ label: 'NATIONALITY', value: ind.nationality })
                  if (hasDocNumber) secondRowItems.push({ label: 'PASSPORT NO.', value: docNumber })
                  if (hasExpiryDate)
                    secondRowItems.push({ label: 'EXPIRY DATE', value: formatExpiry(expiryDate) })

                  return (
                    <div
                      key={idx}
                      className="space-y-2 sm:space-y-3 border-t border-gray-100 pt-2 sm:pt-3 first:border-0 first:pt-0 dark:border-gray-700"
                    >
                      {/* Row 1: Name, Type, GENDER, DATE OF BIRTH */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4 md:gap-x-6 md:gap-y-3">
                        <div>
                          <Label>NAME</Label>
                          <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                            {fullName || '-'}
                          </p>
                          {hasTicketNum && (
                            <p
                              className={`mt-1 text-xs font-medium leading-tight text-gray-600 dark:text-gray-400 ${GeistMono.className}`}
                            >
                              Ticket: {ticketNum}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label>TYPE</Label>
                          <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                            {pax.ptc ?? '-'}
                          </p>
                        </div>
                        <div>
                          <Label>GENDER</Label>
                          <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                            {ind.gender ?? '-'}
                          </p>
                        </div>
                        <div>
                          <Label>DATE OF BIRTH</Label>
                          <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                            {formatBirthdate(ind.birthdate)}
                          </p>
                        </div>
                      </div>
                      {/* Row 2: Other items (only if data present) */}
                      {secondRowItems.length > 0 && (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 md:grid-cols-6 md:gap-x-6 md:gap-y-3">
                          {secondRowItems.map((item) => (
                            <div key={item.label}>
                              <Label>{item.label}</Label>
                              <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* 3. Itinerary (Outbound + Return in separate light-gray blocks) */}
            {(outboundSegments.length > 0 || returnSegments.length > 0) && (
              <Card>
                <h2
                  className={`${GeistSans.className} mb-1.5 text-base font-bold leading-tight text-gray-900 dark:text-white`}
                >
                  Itinerary
                </h2>
                <div className="mb-2 sm:mb-3 grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3 md:gap-x-4">
                  <div>
                    <Label>AIRLINE</Label>
                    <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                      {commonAirline}
                    </p>
                  </div>
                  <div>
                    <Label>AIRLINE PNR</Label>
                    <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                      {commonPNR}
                    </p>
                  </div>
                  <div>
                    <Label>CLASS</Label>
                    <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                      {commonClass}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {outboundSegments.length > 0 && (
                    <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2 sm:p-3">
                      <p
                        className={`${GeistSans.className} mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400`}
                      >
                        Outbound
                      </p>
                      {outboundSegments.map((item, i) => {
                        const seg = item.paxSegment
                        const dep = seg.departure
                        const arr = seg.arrival
                        const depCity = getAirportCity(dep.iatA_LocationCode)
                        const arrCity = getAirportCity(arr.iatA_LocationCode)
                        const durationMin = parseInt(seg.duration ?? '0', 10)
                        const durationStr =
                          durationMin >= 60
                            ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
                            : `${durationMin}m`
                        return (
                          <div
                            key={i}
                            className="border-t border-gray-200/80 dark:border-white/10 pt-2 sm:pt-3 first:border-0 first:pt-0"
                          >
                            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-3">
                              <div>
                                <Label>DEPARTURE</Label>
                                <p className="mt-0.5 text-xl font-bold leading-tight text-gray-900 dark:text-white">
                                  {formatFlightTime(dep.aircraftScheduledDateTime)}
                                </p>
                                <p className="text-sm font-bold leading-tight text-gray-900 dark:text-white">
                                  {depCity}
                                </p>
                                <p className="text-xs leading-tight text-gray-500 dark:text-gray-400">
                                  {formatFlightDate(dep.aircraftScheduledDateTime)}
                                </p>
                              </div>
                              <div className="flex flex-col items-center px-1">
                                <Label>DURATION</Label>
                                <p className="mt-0.5 text-sm font-bold leading-tight text-gray-900 dark:text-white">
                                  {durationStr}
                                </p>
                                <div className="relative mt-0.5 flex w-14 items-center">
                                  <div className="h-px flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
                                  <Plane className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 text-gray-400" />
                                </div>
                              </div>
                              <div className="text-right">
                                <Label>ARRIVAL</Label>
                                <p className="mt-0.5 text-xl font-bold leading-tight text-gray-900 dark:text-white">
                                  {formatFlightTime(arr.aircraftScheduledDateTime)}
                                </p>
                                <p className="text-sm font-bold leading-tight text-gray-900 dark:text-white">
                                  {arrCity}
                                </p>
                                <p className="text-xs leading-tight text-gray-500 dark:text-gray-400">
                                  {formatFlightDate(arr.aircraftScheduledDateTime)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-5 md:gap-x-4">
                              <div>
                                <Label>FLIGHT</Label>
                                <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                                  {seg.marketingCarrierInfo.carrierDesigCode}
                                  {seg.flightNumber}
                                </p>
                              </div>
                              <div>
                                <Label>AIRCRAFT</Label>
                                <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                                  {seg.iatA_AircraftType.iatA_AircraftTypeCode}
                                </p>
                              </div>
                              <div>
                                <Label>DEP TERMINAL</Label>
                                <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                                  {dep.terminalName ?? '-'}
                                </p>
                              </div>
                              <div>
                                <Label>ARR TERMINAL</Label>
                                <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                                  {arr.terminalName ?? '-'}
                                </p>
                              </div>
                              <div>
                                <Label>RBD</Label>
                                <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                                  {seg.rbd}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {returnSegments.length > 0 && (
                    <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2 sm:p-3">
                      <p
                        className={`${GeistSans.className} mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400`}
                      >
                        Return
                      </p>
                      {returnSegments.map((item, i) => {
                        const seg = item.paxSegment
                        const dep = seg.departure
                        const arr = seg.arrival
                        const depCity = getAirportCity(dep.iatA_LocationCode)
                        const arrCity = getAirportCity(arr.iatA_LocationCode)
                        const durationMin = parseInt(seg.duration ?? '0', 10)
                        const durationStr =
                          durationMin >= 60
                            ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
                            : `${durationMin}m`
                        return (
                          <div
                            key={i}
                            className="border-t border-gray-200/80 dark:border-white/10 pt-2 sm:pt-3 first:border-0 first:pt-0"
                          >
                            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-3">
                              <div>
                                <Label>DEPARTURE</Label>
                                <p className="mt-0.5 text-xl font-bold leading-tight text-gray-900 dark:text-white">
                                  {formatFlightTime(dep.aircraftScheduledDateTime)}
                                </p>
                                <p className="text-sm font-bold leading-tight text-gray-900 dark:text-white">
                                  {depCity}
                                </p>
                                <p className="text-xs leading-tight text-gray-500 dark:text-gray-400">
                                  {formatFlightDate(dep.aircraftScheduledDateTime)}
                                </p>
                              </div>
                              <div className="flex flex-col items-center px-1">
                                <Label>DURATION</Label>
                                <p className="mt-0.5 text-sm font-bold leading-tight text-gray-900 dark:text-white">
                                  {durationStr}
                                </p>
                                <div className="relative mt-0.5 flex w-14 items-center">
                                  <div className="h-px flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
                                  <Plane className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 text-gray-400" />
                                </div>
                              </div>
                              <div className="text-right">
                                <Label>ARRIVAL</Label>
                                <p className="mt-0.5 text-xl font-bold leading-tight text-gray-900 dark:text-white">
                                  {formatFlightTime(arr.aircraftScheduledDateTime)}
                                </p>
                                <p className="text-sm font-bold leading-tight text-gray-900 dark:text-white">
                                  {arrCity}
                                </p>
                                <p className="text-xs leading-tight text-gray-500 dark:text-gray-400">
                                  {formatFlightDate(arr.aircraftScheduledDateTime)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-5 md:gap-x-4">
                              <div>
                                <Label>FLIGHT</Label>
                                <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                                  {seg.marketingCarrierInfo.carrierDesigCode}
                                  {seg.flightNumber}
                                </p>
                              </div>
                              <div>
                                <Label>AIRCRAFT</Label>
                                <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                                  {seg.iatA_AircraftType.iatA_AircraftTypeCode}
                                </p>
                              </div>
                              <div>
                                <Label>DEP TERMINAL</Label>
                                <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                                  {dep.terminalName ?? '-'}
                                </p>
                              </div>
                              <div>
                                <Label>ARR TERMINAL</Label>
                                <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                                  {arr.terminalName ?? '-'}
                                </p>
                              </div>
                              <div>
                                <Label>RBD</Label>
                                <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                                  {seg.rbd}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 4. Baggage Allowance */}
            {baggageList.length > 0 && (
              <Card>
                <h2
                  className={`${GeistSans.className} mb-1.5 text-base font-bold leading-tight text-gray-900 dark:text-white`}
                >
                  Baggage Allowance
                </h2>
                <div className="space-y-1.5 sm:space-y-2">
                  {baggageList.map((b, i) => {
                    const bag = b.baggageAllowance
                    const checkIn = bag.checkIn?.[0]?.allowance ?? '-'
                    const cabin = bag.cabin?.[0]?.allowance ?? '-'
                    return (
                      <div
                        key={i}
                        className="border-t border-gray-100 pt-1.5 sm:pt-2 first:border-0 first:pt-0 dark:border-gray-700"
                      >
                        <p className="mb-0.5 sm:mb-1 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                          {getAirportCity(bag.departure)} → {getAirportCity(bag.arrival)}
                        </p>
                        <div className="flex gap-4 sm:gap-6">
                          <div>
                            <Label>CHECK-IN (ADULT)</Label>
                            <p className="mt-0.5 text-sm font-bold leading-tight text-gray-900 dark:text-white">
                              {checkIn}
                            </p>
                          </div>
                          <div>
                            <Label>CABIN (ADULT)</Label>
                            <p className="mt-0.5 text-sm font-bold leading-tight text-gray-900 dark:text-white">
                              {cabin}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* 5. Refund & Exchange Penalties */}
            {penalty &&
              (penalty.refundPenaltyList?.length ?? 0) +
                (penalty.exchangePenaltyList?.length ?? 0) >
                0 && (
                <Card>
                  <h2
                    className={`${GeistSans.className} mb-1.5 text-base font-bold leading-tight text-gray-900 dark:text-white`}
                  >
                    Penalty Information
                  </h2>
                  <div className="grid grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2 md:gap-6">
                    {/* Refund column */}
                    <div className="space-y-2 sm:space-y-3">
                      {penalty.refundPenaltyList?.map((item, i) => {
                        const r = item.refundPenalty
                        return (
                          <div
                            key={`refund-${i}`}
                            className="border-t border-gray-100 pt-1.5 sm:pt-2 first:border-0 first:pt-0 dark:border-gray-700"
                          >
                            <p
                              className={`${GeistSans.className} mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400`}
                            >
                              Refund — {getAirportCity(r.departure)} → {getAirportCity(r.arrival)}
                            </p>
                            <ul className="space-y-1.5">
                              {r.penaltyInfoList?.map((p, j) => (
                                <li key={j}>
                                  <p className="mt-0.5 text-xs font-semibold leading-tight text-gray-900 dark:text-white">
                                    {p.penaltyInfo.type}
                                  </p>
                                  <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-xs text-gray-700 dark:text-gray-300">
                                    {p.penaltyInfo.textInfoList
                                      ?.flatMap((t) => t.textInfo.info ?? [])
                                      .map((line, k) => (
                                        <li key={k} className="leading-tight">
                                          {line}
                                        </li>
                                      ))}
                                  </ul>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                    {/* Exchange column */}
                    <div className="space-y-2 sm:space-y-3">
                      {penalty.exchangePenaltyList?.map((item, i) => {
                        const e = item.exchangePenalty
                        return (
                          <div
                            key={`exchange-${i}`}
                            className="border-t border-gray-100 pt-1.5 sm:pt-2 first:border-0 first:pt-0 dark:border-gray-700"
                          >
                            <p
                              className={`${GeistSans.className} mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400`}
                            >
                              Exchange — {getAirportCity(e.departure)} → {getAirportCity(e.arrival)}
                            </p>
                            <ul className="space-y-1.5">
                              {e.penaltyInfoList?.map((p, j) => (
                                <li key={j}>
                                  <p className="mt-0.5 text-xs font-semibold leading-tight text-gray-900 dark:text-white">
                                    {p.penaltyInfo.type}
                                  </p>
                                  <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-xs text-gray-700 dark:text-gray-300">
                                    {p.penaltyInfo.textInfoList
                                      ?.flatMap((t) => t.textInfo.info ?? [])
                                      .map((line, k) => (
                                        <li key={k} className="leading-tight">
                                          {line}
                                        </li>
                                      ))}
                                  </ul>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              )}

            {/* 6. Pricing Details + Order info */}
            <Card>
              <h2
                className={`${GeistSans.className} mb-1.5 text-base font-bold leading-tight text-gray-900 dark:text-white`}
              >
                Pricing Details
              </h2>
              <div className="grid gap-2 sm:gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-0.5 sm:mb-1 block">FARE BREAKDOWN (PER ADULT)</Label>
                  <ul className="space-y-1 text-xs">
                    {fareDetails.map((fd, i) => {
                      const f = fd.fareDetail
                      const mult = f.paxCount > 1 ? ` (x${f.paxCount})` : ''
                      return (
                        <li key={i} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Base Fare{mult}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {f.currency} {f.baseFare.toLocaleString()}
                          </span>
                        </li>
                      )
                    })}
                    {fareDetails.map((fd, i) => (
                      <li key={`tax-${i}`} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tax</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {fd.fareDetail.currency} {fd.fareDetail.tax.toLocaleString()}
                        </span>
                      </li>
                    ))}
                    {fareDetails.some((fd) => fd.fareDetail.discount > 0) && (
                      <li className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Discount</span>
                        <span className="font-semibold">
                          - {firstItem?.fareDetailList?.[0]?.fareDetail.currency}{' '}
                          {firstItem?.fareDetailList?.[0]?.fareDetail.discount.toLocaleString()}
                        </span>
                      </li>
                    )}
                    {price?.totalVAT?.total != null && price.totalVAT.total > 0 && (
                      <li className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">VAT</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {price.totalVAT.curreny} {price.totalVAT.total.toLocaleString()}
                        </span>
                      </li>
                    )}
                    {price?.totalPayable && (
                      <li className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                        <span>Total</span>
                        <span>
                          {price.totalPayable.curreny} {price.totalPayable.total.toLocaleString()}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <Label className="mb-0.5 sm:mb-1 block">ORDER INFORMATION</Label>
                  <ul className="space-y-1 text-xs">
                    <li className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">FARE TYPE</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {firstItem?.fareType ?? '-'}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">REFUNDABLE</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {firstItem?.refundable ? 'Yes' : 'No'}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">VALIDATING CARRIER</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {firstItem?.validatingCarrier ?? '-'}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* 7. Contact Information + Print */}
            <Card>
              <h2
                className={`${GeistSans.className} mb-1.5 text-base font-bold leading-tight text-gray-900 dark:text-white`}
              >
                Contact Information
              </h2>
              <div className="flex flex-wrap gap-4 sm:gap-6">
                <div>
                  <Label>EMAIL</Label>
                  <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                    {contact.emailAddress}
                  </p>
                </div>
                <div>
                  <Label>PHONE</Label>
                  <p className="mt-0.5 text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                    {contact.phoneNumber}
                  </p>
                </div>
              </div>
            </Card>

            <div className="print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className={`${GeistSans.className} w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200`}
              >
                Print Ticket
              </button>
            </div>
          </div>

          {/* Right column: Actions card (like Service Fee card in top right) */}
          <aside className="print:hidden w-full shrink-0 lg:w-[220px] lg:sticky lg:top-4">
            <Card>
              <h2
                className={`${GeistSans.className} mb-3 flex items-center gap-2 text-base font-bold leading-tight text-gray-900 dark:text-white`}
              >
                <span className="text-primary">Actions</span>
              </h2>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={refreshLoading}
                  className={`${GeistSans.className} inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none`}
                >
                  {refreshLoading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 shrink-0" />
                  )}
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className={`${GeistSans.className} inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700`}
                >
                  <Printer className="h-4 w-4 shrink-0" />
                  Print & Download
                </button>
                {order.orderStatus === 'OnHold' && displayStatus !== 'Expired' && (
                  <button
                    type="button"
                    onClick={openOrderConfirmModal}
                    disabled={actionLoading !== null || showConfirmPopup}
                    className={`${GeistSans.className} inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none`}
                  >
                    {actionLoading === 'confirm' ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 shrink-0" />
                    )}
                    Order Confirm
                  </button>
                )}
                {order.orderStatus === 'OnHold' && displayStatus !== 'Expired' && (
                  <button
                    type="button"
                    onClick={openCancelConfirmModal}
                    disabled={actionLoading !== null}
                    className={`${GeistSans.className} inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-600 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/30 disabled:opacity-50 disabled:pointer-events-none`}
                  >
                    {actionLoading === 'cancel' ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0" />
                    )}
                    Cancel
                  </button>
                )}
                {showRefundChangeFlight && (
                  <>
                    <button
                      type="button"
                      onClick={openRefundModal}
                      disabled={refundChangeFlightDisabled}
                      title={isOrderInProgress ? 'In Progress – Refund unavailable' : undefined}
                      className={`${GeistSans.className} inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline ${
                        refundChangeFlightDisabled
                          ? 'border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-500'
                          : 'border-orange-600 bg-white text-orange-600 hover:bg-orange-50 dark:border-orange-500 dark:bg-transparent dark:text-orange-400 dark:hover:bg-orange-950/30'
                      }`}
                    >
                      <RotateCcw className="h-4 w-4 shrink-0" />
                      Refund
                    </button>
                    <button
                      type="button"
                      onClick={openChangeFlightModal}
                      disabled={refundChangeFlightDisabled}
                      title={
                        isOrderInProgress ? 'In Progress – Change Flight unavailable' : undefined
                      }
                      className={`${GeistSans.className} inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline ${
                        refundChangeFlightDisabled
                          ? 'border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-500'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Plane className="h-4 w-4 shrink-0" />
                      Change Flight
                    </button>
                  </>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
