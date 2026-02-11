'use client'

import { AlertCircle, CalendarX, CheckCircle, Clock, Loader2, Plane, RefreshCw, XCircle } from 'lucide-react'

import type { TransformedMiniRule, RoutePolicy } from '@/types/flight/domain/minirule.types'

interface MiniRuleInfoProps {
  miniRule: TransformedMiniRule | null
  loading: boolean
  error: string | null
  type: 'cancellation' | 'dateChange'
}

export function MiniRuleInfo({ miniRule, loading, error, type }: MiniRuleInfoProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      </div>
    )
  }

  if (!miniRule) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <AlertCircle className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          No {type === 'cancellation' ? 'cancellation' : 'date change'} policy available
        </span>
      </div>
    )
  }

  const policies = type === 'cancellation' ? miniRule.cancellation : miniRule.dateChange
  const title = type === 'cancellation' ? 'CANCELLATION POLICY' : 'DATE CHANGE POLICY'
  const Icon = type === 'cancellation' ? CalendarX : RefreshCw

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>

      {policies.length === 0 ? (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          No policy information available
        </div>
      ) : (
        <div className="grid gap-2">
          {policies.map((routePolicy, routeIndex) => (
            <RoutePolicyCard key={routeIndex} routePolicy={routePolicy} />
          ))}
        </div>
      )}
    </div>
  )
}

interface RoutePolicyCardProps {
  routePolicy: RoutePolicy
}

function RoutePolicyCard({ routePolicy }: RoutePolicyCardProps) {
  // Get unique policy info (first passenger type is enough since they're usually the same)
  const uniquePolicies = routePolicy.policies.map(policy => {
    // Get the first passenger's details (usually same for all pax types)
    const firstPaxDetails = policy.passengerPolicies[0]?.details || []
    return {
      type: policy.type,
      details: firstPaxDetails,
    }
  })

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Route Header - Compact */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800">
        <Plane className="w-3 h-3 text-gray-500 dark:text-gray-400" />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {routePolicy.route}
        </span>
      </div>

      {/* Policy Details - Compact */}
      <div className="px-3 py-2 space-y-1.5">
        {uniquePolicies.map((policy, policyIndex) => (
          <div key={policyIndex} className="flex items-start gap-2">
            {/* Policy Type with Icon */}
            <div className="flex items-center gap-1 min-w-[90px] flex-shrink-0">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                {policy.type}
              </span>
            </div>

            {/* Policy Status */}
            <div className="flex flex-wrap gap-1">
              {policy.details.map((detail, detailIndex) => (
                <PolicyBadge key={detailIndex} detail={detail} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface PolicyBadgeProps {
  detail: string
}

function PolicyBadge({ detail }: PolicyBadgeProps) {
  const lowerDetail = detail.toLowerCase()
  
  // Determine policy status
  const isNonRefundable = lowerDetail.includes('non refundable') || lowerDetail.includes('non-refundable')
  const isNonExchangeable = lowerDetail.includes('non exchangable') || lowerDetail.includes('non exchangeable') || lowerDetail.includes('non-exchangeable')
  const isNotAllowed = isNonRefundable || isNonExchangeable
  const isRefundable = !isNotAllowed && (lowerDetail.includes('refundable') || lowerDetail.includes('allowed'))
  const hasAmount = /\d+/.test(detail) && (lowerDetail.includes('bdt') || lowerDetail.includes('usd') || lowerDetail.includes('penalty') || lowerDetail.includes('fee'))

  // Determine styling
  let Icon = AlertCircle
  let bgClass = 'bg-gray-100 dark:bg-gray-700'
  let textClass = 'text-gray-600 dark:text-gray-300'
  let iconClass = 'text-gray-500 dark:text-gray-400'

  if (isNotAllowed) {
    Icon = XCircle
    bgClass = 'bg-red-100 dark:bg-red-900/30'
    textClass = 'text-red-700 dark:text-red-300'
    iconClass = 'text-red-500 dark:text-red-400'
  } else if (isRefundable) {
    Icon = CheckCircle
    bgClass = 'bg-green-100 dark:bg-green-900/30'
    textClass = 'text-green-700 dark:text-green-300'
    iconClass = 'text-green-500 dark:text-green-400'
  } else if (hasAmount) {
    Icon = AlertCircle
    bgClass = 'bg-amber-100 dark:bg-amber-900/30'
    textClass = 'text-amber-700 dark:text-amber-300'
    iconClass = 'text-amber-500 dark:text-amber-400'
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${bgClass} ${textClass}`}>
      <Icon className={`w-3 h-3 ${iconClass}`} />
      {detail}
    </span>
  )
}
