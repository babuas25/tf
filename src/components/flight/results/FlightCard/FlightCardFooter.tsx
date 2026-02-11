'use client'

import { Plane, DollarSign, Briefcase, Shield, ChevronDown, ChevronUp, CalendarX, RefreshCw, FileText } from 'lucide-react'
import { useState } from 'react'

interface FlightCardFooterProps {
  offer: {
    refundable: boolean
    segments: Array<{
      segments: Array<{
        cabinClass: string
        bookingClass: string
      }>
    }>
  }
  onShowFlightDetails?: () => void
  onShowFareSummary?: () => void
  onShowBaggage?: () => void
  onShowCancellation?: () => void
  onShowDateChange?: () => void
  onShowFareRules?: () => void
  onShowNotice?: () => void
  onSelectFare?: () => void
  /** Show select button in footer (for two-oneway on medium-large screens without sidebar) */
  showSelectButton?: boolean
  /** Is this a two-oneway offer (hides refundable badge) */
  isTwoOneway?: boolean
}

export function FlightCardFooter({
  offer,
  onShowFlightDetails,
  onShowFareSummary,
  onShowBaggage,
  onShowCancellation,
  onShowDateChange,
  onShowFareRules,
  onSelectFare,
  showSelectButton = false,
  isTwoOneway = false,
}: FlightCardFooterProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const tabs = [
    { id: 'flight-details', icon: Plane, label: 'Itinerary', onClick: onShowFlightDetails },
    { id: 'fare-summary', icon: DollarSign, label: 'Fare', onClick: onShowFareSummary },
    { id: 'baggage', icon: Briefcase, label: 'Baggage', onClick: onShowBaggage },
    { id: 'cancellation', icon: CalendarX, label: 'Cancellation', onClick: onShowCancellation },
    { id: 'date-change', icon: RefreshCw, label: 'Date Change', onClick: onShowDateChange },
    { id: 'fare-rules', icon: FileText, label: 'Fare Rules', onClick: onShowFareRules },
  ]

  const handleTabClick = (tabId: string, onClick?: () => void) => {
    setActiveTab(activeTab === tabId ? null : tabId)
    onClick?.()
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  // Conditional classes for compact (two-oneway with showSelectButton) vs regular layout
  const desktopContainerClass = showSelectButton
    ? "flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 px-2 lg:px-3 3xl:px-4 h-[44px] lg:h-[48px] 3xl:h-[52px]"
    : "flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 px-4 h-[52px]"

  const refundableGapClass = showSelectButton
    ? "flex items-center gap-2 lg:gap-3"
    : "flex items-center gap-3"

  const refundableIconClass = showSelectButton
    ? "flex items-center gap-1 lg:gap-2 text-primary/80 hover:text-primary transition-colors cursor-pointer"
    : "flex items-center gap-2 text-primary/80 hover:text-primary transition-colors cursor-pointer"

  const shieldClass = showSelectButton
    ? "w-3 h-3 lg:w-3.5 lg:h-3.5"
    : "w-3.5 h-3.5"

  const refundableTextClass = showSelectButton
    ? "text-[10px] lg:text-xs font-medium"
    : "text-xs font-medium"

  const tabsGapClass = showSelectButton
    ? "flex items-center gap-0.5 lg:gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
    : "flex items-center gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"

  const tabButtonClass = (isActive: boolean) => {
    const baseActive = 'bg-primary/90 hover:bg-primary text-white'
    const baseInactive = 'text-gray-600 dark:text-gray-300 hover:text-primary/80 hover:bg-primary/10 dark:hover:bg-primary/20'
    
    if (showSelectButton) {
      return `flex items-center gap-1 lg:gap-1.5 px-1.5 lg:px-2 3xl:px-3 py-1.5 lg:py-2 text-[9px] lg:text-[10px] 3xl:text-xs font-medium transition-colors rounded whitespace-nowrap ${isActive ? baseActive : baseInactive}`
    }
    return `flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors rounded whitespace-nowrap ${isActive ? baseActive : baseInactive}`
  }

  const tabIconClass = showSelectButton
    ? "w-3 h-3 lg:w-3.5 lg:h-3.5"
    : "w-3.5 h-3.5"

  return (
    <div className="border-t border-gray-200/80 dark:border-white/10">
      {/* Mobile: Collapsed "View Details" Button */}
      <div className="lg:hidden">
        {!isExpanded ? (
          <button
            onClick={toggleExpand}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FileText className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              View Details
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-300" />
          </button>
        ) : (
          <div>
            {/* Collapse Button */}
            <button
              onClick={toggleExpand}
              className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-b border-gray-200/80 dark:border-white/10"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Hide Details
              </span>
              <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-300" />
            </button>

            {/* Expanded Tab Bar */}
            <div className="bg-gray-50 dark:bg-gray-800/50 px-2 py-2">
              {/* Refundability (hidden for two-oneway) */}
              {!isTwoOneway && offer.refundable && (
                <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                  <Shield className="w-3 h-3 text-primary/80" />
                  <span className="text-[10px] font-medium text-primary/80">Refundable</span>
                </div>
              )}

              {/* Info Tabs */}
              <div className="flex flex-col gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id, tab.onClick)}
                      className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors rounded ${
                        isActive
                          ? 'bg-primary/90 hover:bg-primary text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:text-primary/80 hover:bg-primary/10 dark:hover:bg-primary/20'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="flex-1 text-left">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Always Show Full Tab Bar */}
      <div className="hidden lg:block">
        <div className={desktopContainerClass}>
          {/* Left: Refundability & Class Info (hidden for two-oneway) */}
          <div className={`${refundableGapClass} flex-shrink-0`}>
            {!isTwoOneway && offer.refundable && (
              <div className={refundableIconClass}>
                <Shield className={shieldClass} />
                <span className={refundableTextClass}>Refundable</span>
              </div>
            )}
          </div>

          {/* Center: Info Tabs - Scrollable */}
          <div className={`${tabsGapClass} flex-1 min-w-0 mx-2 py-1`}>
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id, tab.onClick)}
                  className={`${tabButtonClass(isActive)} flex-shrink-0`}
                >
                  <Icon className={tabIconClass} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Right: Select Button (shown on lg-3xl when showSelectButton is true for two-oneway) */}
          {showSelectButton && (
            <button
              onClick={onSelectFare}
              className="hidden lg:flex 3xl:hidden items-center justify-center px-4 lg:px-5 py-1.5 lg:py-2 bg-primary/90 hover:bg-primary text-white text-[10px] lg:text-xs font-semibold rounded transition-colors flex-shrink-0"
            >
              Select
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
