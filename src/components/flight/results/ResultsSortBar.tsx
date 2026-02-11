'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export type ResultsSortKey =
  | 'none'
  | 'dep-early-late'
  | 'dep-late-early'
  | 'price-low-high'
  | 'price-high-low'
  | 'layover-short-long'
  | 'layover-long-short'

interface ResultsSortBarProps {
  value: ResultsSortKey
  onChange: (next: ResultsSortKey) => void
}

export function ResultsSortBar({ value, onChange }: ResultsSortBarProps) {
  type MenuKey = 'departure' | 'price' | 'layover' | null
  const [open, setOpen] = useState<MenuKey>(null)

  // Close on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const selectedLabel = useMemo(() => {
    const labelFor = (k: ResultsSortKey): string => {
      switch (k) {
        case 'dep-early-late':
          return 'Early to Late'
        case 'dep-late-early':
          return 'Late to Early'
        case 'price-low-high':
          return 'Low to High'
        case 'price-high-low':
          return 'High to Low'
        case 'layover-short-long':
          return 'Short to Long'
        case 'layover-long-short':
          return 'Long to Short'
        default:
          return ''
      }
    }

    const dep = value === 'dep-early-late' || value === 'dep-late-early' ? labelFor(value) : ''
    const price = value === 'price-low-high' || value === 'price-high-low' ? labelFor(value) : ''
    const lay = value === 'layover-short-long' || value === 'layover-long-short' ? labelFor(value) : ''
    return { dep, price, lay }
  }, [value])

  const btnClass =
    'h-9 w-full rounded-lg border px-3 pr-8 text-left text-[11px] sm:text-xs font-medium ' +
    'bg-white dark:bg-neutral-950 border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 ' +
    'hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/40'

  // Mobile: 3 columns (no scroll)
  // Desktop: stretch to equal columns
  const wrapperClass = 'relative min-w-0 sm:flex-1'

  const menuClass =
    'absolute left-0 right-0 mt-1 z-50 rounded-lg border shadow-lg overflow-hidden ' +
    'border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-950'

  const itemClass =
    'w-full text-left px-3 py-2 text-[11px] sm:text-xs transition-colors ' +
    'text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-neutral-900'

  const activeItemClass =
    'bg-primary/10 text-primary dark:text-primary'

  const choose = (next: ResultsSortKey | 'none') => {
    onChange(next === 'none' ? 'none' : next)
    setOpen(null)
  }

  return (
    <div className="w-full">
      {/* Backdrop to close menus */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default"
          aria-label="Close sort menu"
          onClick={() => setOpen(null)}
        />
      )}

      <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
        {/* Departure dropdown */}
        <div className={wrapperClass}>
          <button
            type="button"
            className={btnClass}
            onClick={() => setOpen((v) => (v === 'departure' ? null : 'departure'))}
          >
            <span className="truncate">
              Departure{selectedLabel.dep ? ` › ${selectedLabel.dep}` : ''}
            </span>
          </button>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-300" />
          {open === 'departure' && (
            <div className={menuClass}>
              <button
                type="button"
                className={[itemClass, value === 'dep-early-late' || value === 'dep-late-early' ? '' : activeItemClass].join(' ')}
                onClick={() => choose('none')}
              >
                Departure (Default)
              </button>
              <button
                type="button"
                className={[itemClass, value === 'dep-early-late' ? activeItemClass : ''].join(' ')}
                onClick={() => choose('dep-early-late')}
              >
                Early to Late
              </button>
              <button
                type="button"
                className={[itemClass, value === 'dep-late-early' ? activeItemClass : ''].join(' ')}
                onClick={() => choose('dep-late-early')}
              >
                Late to Early
              </button>
            </div>
          )}
        </div>

        {/* Price dropdown */}
        <div className={wrapperClass}>
          <button
            type="button"
            className={btnClass}
            onClick={() => setOpen((v) => (v === 'price' ? null : 'price'))}
          >
            <span className="truncate">
              Price{selectedLabel.price ? ` › ${selectedLabel.price}` : ''}
            </span>
          </button>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-300" />
          {open === 'price' && (
            <div className={menuClass}>
              <button
                type="button"
                className={[itemClass, value === 'price-low-high' || value === 'price-high-low' ? '' : activeItemClass].join(' ')}
                onClick={() => choose('none')}
              >
                Price (Default)
              </button>
              <button
                type="button"
                className={[itemClass, value === 'price-low-high' ? activeItemClass : ''].join(' ')}
                onClick={() => choose('price-low-high')}
              >
                Low to High
              </button>
              <button
                type="button"
                className={[itemClass, value === 'price-high-low' ? activeItemClass : ''].join(' ')}
                onClick={() => choose('price-high-low')}
              >
                High to Low
              </button>
            </div>
          )}
        </div>

        {/* Layover dropdown */}
        <div className={wrapperClass}>
          <button
            type="button"
            className={btnClass}
            onClick={() => setOpen((v) => (v === 'layover' ? null : 'layover'))}
          >
            <span className="truncate">
              Layover{selectedLabel.lay ? ` › ${selectedLabel.lay}` : ''}
            </span>
          </button>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-300" />
          {open === 'layover' && (
            <div className={menuClass}>
              <button
                type="button"
                className={[itemClass, value === 'layover-short-long' || value === 'layover-long-short' ? '' : activeItemClass].join(' ')}
                onClick={() => choose('none')}
              >
                Layover (Default)
              </button>
              <button
                type="button"
                className={[itemClass, value === 'layover-short-long' ? activeItemClass : ''].join(' ')}
                onClick={() => choose('layover-short-long')}
              >
                Short to Long
              </button>
              <button
                type="button"
                className={[itemClass, value === 'layover-long-short' ? activeItemClass : ''].join(' ')}
                onClick={() => choose('layover-long-short')}
              >
                Long to Short
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

