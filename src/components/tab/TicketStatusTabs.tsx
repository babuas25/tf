'use client'

import Link from 'next/link'

import { cn } from '@/lib/utils'

interface TicketStatusTab {
  label: string
  value: string
}

interface TicketStatusTabsProps {
  className?: string
  activeTab: string
  onTabChange: (value: string) => void
}

const TICKET_STATUS_TABS: TicketStatusTab[] = [
  { label: 'All', value: 'all' },
  { label: 'On Hold', value: 'on-hold' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Expired', value: 'expired' },
  { label: 'Un-Confirmed', value: 'unconfirmed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export function TicketStatusTabs({ className, activeTab, onTabChange }: TicketStatusTabsProps) {
  return (
    <div
      className={cn(
        'w-full border-b border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm',
        className,
      )}
      role="tablist"
      aria-label="Ticket status navigation"
    >
      <div className="hidden md:grid md:grid-cols-8 md:gap-0">
        {TICKET_STATUS_TABS.map((item) => (
          <Link
            key={item.value}
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onTabChange(item.value)
            }}
            aria-label={`Filter by ${item.label}`}
            role="tab"
            aria-selected={activeTab === item.value}
            className={cn(
              'flex items-center justify-center py-2 text-xs font-medium transition-all duration-200',
              activeTab === item.value
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      
      {/* Mobile horizontal scrolling */}
      <div className="md:hidden flex overflow-x-auto">
        {TICKET_STATUS_TABS.map((item) => (
          <Link
            key={item.value}
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onTabChange(item.value)
            }}
            aria-label={`Filter by ${item.label}`}
            role="tab"
            aria-selected={activeTab === item.value}
            className={cn(
              'flex-shrink-0 px-3 py-2 text-xs font-medium transition-all duration-200 whitespace-nowrap',
              activeTab === item.value
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}