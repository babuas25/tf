'use client'

import { Check, ChevronDown, ChevronUp, Filter, RotateCcw, X } from 'lucide-react'
import { useCallback, useState } from 'react'

import { AirlineLogo } from '@/components/flight/shared/AirlineLogo'
import type {
  Alliance,
  AirlineFilterOption,
  AirportFilterOption,
  AllianceFilterOption,
  DurationRange,
  FlightFilters,
  LayoverTime,
  PriceRange,
  StopFilter,
  TimeSlot,
} from '@/types/flight/ui/filter.types'
import { defaultFilters, formatDuration, formatPrice } from '@/types/flight/ui/filter.types'

// Star Alliance Logo SVG
function StarAllianceLogo({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 115" width={size} height={size} className="object-contain">
      <g>
        <path fillRule="evenodd" clipRule="evenodd" fill="#C9CBCD" d="M78.568,24.125c2.972-4.122,6.272-8.088,9.905-11.851c3.646-3.775,7.501-7.227,11.532-10.349l-4.313,17.288L78.568,24.125z"/>
        <path fillRule="evenodd" clipRule="evenodd" fill="#5B5C5E" d="M108.51,31.59c-5.056-0.513-10.141-1.388-15.216-2.653c-5.092-1.27-10.009-2.883-14.729-4.813l17.128-4.91L108.51,31.59z"/>
        <path fillRule="evenodd" clipRule="evenodd" fill="#999B9D" d="M100.004,1.929c2.084,4.635,3.869,9.475,5.311,14.503c1.447,5.045,2.508,10.109,3.196,15.161L95.693,19.214L100.004,1.929z"/>
        <path fillRule="evenodd" clipRule="evenodd" fill="#999B9D" d="M72.519,59.657c-3.003-4.099-5.754-8.463-8.209-13.081c-2.465-4.634-4.556-9.367-6.279-14.166l15.109,9.444L72.519,59.657z"/>
        <path fillRule="evenodd" clipRule="evenodd" fill="#5B5C5E" d="M88.87,33.49c-2.05,4.649-4.454,9.215-7.225,13.65c-2.781,4.451-5.835,8.629-9.129,12.52l0.623-17.806L88.87,33.49z"/>
        <path fillRule="evenodd" clipRule="evenodd" fill="#C9CBCD" d="M58.032,32.413c5.052-0.55,10.207-0.751,15.434-0.568c5.245,0.184,10.391,0.739,15.408,1.646L73.14,41.854L58.032,32.413z"/>
        <path fillRule="evenodd" clipRule="evenodd" fill="#5B5C5E" d="M104.444,76.394c-4.828,1.588-9.829,2.855-14.98,3.764c-5.168,0.91-10.316,1.438-15.412,1.593l13.65-11.451L104.444,76.394z"/>
        <path fillRule="evenodd" clipRule="evenodd" fill="#999B9D" d="M84.609,52.755c3.788,3.387,7.387,7.084,10.748,11.089c3.375,4.022,6.404,8.216,9.088,12.552l-16.743-6.097L84.609,52.755z"/>
        <path fillRule="evenodd" clipRule="evenodd" fill="#C9CBCD" d="M74.054,81.75c1.039-4.975,2.441-9.939,4.229-14.854c1.796-4.933,3.914-9.653,6.327-14.145l3.092,17.547L74.054,81.75z"/>
        <path fillRule="evenodd" clipRule="evenodd" fill="#999B9D" d="M130.225,51.203c0.019,5.081-0.32,10.229-1.049,15.407c-0.729,5.197-1.821,10.257-3.246,15.151l-6.674-16.521L130.225,51.203z"/>
        <path fillRule="evenodd" clipRule="evenodd" fill="#C9CBCD" d="M101.613,62.76c4.393-2.556,9.021-4.836,13.869-6.795c4.867-1.966,9.792-3.551,14.744-4.764L119.256,65.24L101.613,62.76z"/>
        <path fillRule="evenodd" clipRule="evenodd" fill="#5B5C5E" d="M125.93,81.76c-4.411-2.524-8.699-5.393-12.82-8.614c-4.137-3.231-7.971-6.704-11.498-10.386l17.645,2.48L125.93,81.76z"/>
        <path fillRule="evenodd" clipRule="evenodd" fill="#999B9D" d="M114.234,18.899c4.838,1.552,9.629,3.466,14.33,5.759c4.718,2.301,9.191,4.901,13.406,7.77l-17.774,1.241L114.234,18.899z"/>
        <path fillRule="evenodd" clipRule="evenodd" fill="#C9CBCD" d="M116.386,49.681c-1.076-4.967-1.813-10.073-2.179-15.29c-0.366-5.235-0.35-10.409,0.027-15.494l9.962,14.772L116.386,49.681z"/>
        <path fillRule="evenodd" clipRule="evenodd" fill="#5B5C5E" d="M141.968,32.428c-3.764,3.413-7.817,6.605-12.152,9.53c-4.352,2.935-8.841,5.509-13.433,7.725l7.813-16.014L141.968,32.428z"/>
      </g>
    </svg>
  )
}

// Oneworld Logo SVG
function OneworldLogo({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="1.5 1.5 20.97 20.97" width={size} height={size} className="object-contain">
      <defs>
        <radialGradient id="oneworld_a" cx="23.632%" cy="17.875%" r="162.725%">
          <stop offset="0" stopColor="#fff" stopOpacity=".5"/>
          <stop offset=".283" stopColor="#adabd3" stopOpacity=".595"/>
          <stop offset=".58" stopColor="#5c58a8" stopOpacity=".695"/>
          <stop offset=".791" stopColor="#2a248c" stopOpacity=".766"/>
          <stop offset="1" stopColor="#161082" stopOpacity=".8"/>
        </radialGradient>
        <radialGradient id="oneworld_b" cx="20.432%" cy="15.711%" gradientTransform="matrix(.61524 .78834 -1.01126 .78922 .237 -.128)" r="77.841%">
          <stop offset="0" stopColor="#fff" stopOpacity=".9"/>
          <stop offset=".283" stopColor="#adabd3" stopOpacity=".615"/>
          <stop offset=".58" stopColor="#5c58a8" stopOpacity=".316"/>
          <stop offset=".791" stopColor="#2a248c" stopOpacity=".104"/>
          <stop offset="1" stopColor="#161082" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <g fill="none" fillRule="evenodd" transform="translate(1.5 1.5)">
        <path d="M0 10.483c0 5.78 4.7 10.482 10.483 10.482 5.781 0 10.482-4.7 10.482-10.482C20.965 4.7 16.262 0 10.483 0 4.703 0 0 4.7 0 10.483zm1.07 0c0-5.192 4.222-9.414 9.413-9.414 5.19 0 9.412 4.223 9.412 9.414 0 5.19-4.222 9.412-9.412 9.412-5.191 0-9.414-4.222-9.414-9.412z" fill="#fff" fillRule="nonzero"/>
        <circle cx="10.483" cy="10.483" fill="#161082" r="9.902"/>
        <circle cx="9.952" cy="9.952" fill="url(#oneworld_a)" opacity=".5" r="9.902" transform="translate(.531 .531)"/>
        <circle cx="9.952" cy="9.952" fill="url(#oneworld_b)" r="9.902" transform="translate(.531 .531)"/>
        <path d="M7.762 10.571c.044-.266.223-.446.49-.446.268 0 .446.225.446.446zm1.65.402c.044-.758-.357-1.383-1.16-1.383-.67 0-1.204.49-1.204 1.206 0 .757.49 1.203 1.248 1.203.491 0 .982-.224 1.116-.757h-.67c-.088.177-.222.266-.4.266-.313 0-.492-.223-.492-.535zm9.233.803c.58 0 .803-.49.803-.981s-.224-.982-.803-.982c-.535 0-.758.49-.758.982s.223.981.758.981m1.071.178h-.268v-.446c-.134.313-.49.491-.803.491-.67 0-1.025-.58-1.025-1.204 0-.625.312-1.205 1.025-1.205.357 0 .669.18.803.49V8.788h.267v3.167M9.546 9.68h.312l.58 1.964.535-1.964h.312l.536 1.964.58-1.964h.356l-.713 2.275h-.313l-.579-1.917-.536 1.917h-.312zm5.532 1.116c0 .669-.358 1.204-1.072 1.204-.713 0-1.07-.535-1.07-1.204s.357-1.205 1.07-1.205c.67.045 1.07.58 1.07 1.206m-1.873 0c0 .49.268.98.803.98.536 0 .803-.49.803-.981s-.267-.982-.803-.982c-.535.045-.803.535-.803.982m2.275-1.116h.268v.536a.872.872 0 01.847-.58v.267c-.49-.044-.847.358-.847.804v1.204h-.267V9.68m1.427-.848h.312v3.122h-.268V8.832zM2.275 10.795c0-.267.09-.625.446-.625s.446.357.446.625-.09.624-.446.624-.446-.312-.446-.624m-.758 0c0 .669.491 1.204 1.204 1.204.714 0 1.205-.49 1.205-1.204 0-.67-.491-1.205-1.206-1.205-.713.045-1.204.535-1.204 1.206m2.811-1.117h.714v.313c.133-.224.446-.357.713-.357.758 0 .803.535.803.892v1.427H5.8v-1.07c0-.313.043-.624-.358-.624-.267 0-.401.223-.401.49V12h-.715V9.677" fill="#fff" fillRule="nonzero"/>
      </g>
    </svg>
  )
}

// SkyTeam Logo SVG
function SkyTeamLogo({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="object-contain">
      <defs>
        <linearGradient id="skyteam_grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a237e"/>
          <stop offset="100%" stopColor="#303f9f"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#skyteam_grad)"/>
      <path d="M50 15 L60 35 L82 35 L65 50 L72 72 L50 58 L28 72 L35 50 L18 35 L40 35 Z" fill="#fff" opacity="0.9"/>
      <text x="50" y="90" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="bold">SKYTEAM</text>
    </svg>
  )
}

// Alliance Logo component
function AllianceLogo({ alliance, size = 20 }: { alliance: Alliance; size?: number }) {
  if (alliance === 'Star Alliance') {
    return <StarAllianceLogo size={size} />
  }
  if (alliance === 'Oneworld') {
    return <OneworldLogo size={size} />
  }
  if (alliance === 'SkyTeam') {
    return <SkyTeamLogo size={size} />
  }
  // Fallback for any unknown alliance
  return (
    <div 
      className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded text-[8px] font-medium text-gray-600 dark:text-gray-300"
      style={{ width: size, height: size }}
    >
      A
    </div>
  )
}

// ============================================================================
// Types & Props
// ============================================================================

interface FlightFilterSidebarProps {
  filters: FlightFilters
  onFiltersChange: (filters: FlightFilters) => void
  // Dynamic data from search results
  priceRange?: PriceRange
  durationRange?: DurationRange
  airlines?: AirlineFilterOption[]
  layoverAirports?: AirportFilterOption[]
  allianceOptions?: AllianceFilterOption[]
  stopsOptions?: { value: StopFilter; label: string; count: number }[]
  // Mobile controls
  isMobileOpen?: boolean
  onMobileClose?: () => void
  className?: string
}

// ============================================================================
// Filter Section Component
// ============================================================================

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
  badge?: string | number | undefined
}

function FilterSection({ title, children, defaultExpanded = true, badge }: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="border-b border-gray-200/80 dark:border-white/10 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 px-1.5 text-left hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors rounded-md -mx-0.5"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-100">{title}</span>
          {badge !== undefined && (
            <span className="text-[10px] font-medium bg-primary/12 text-primary px-1.5 py-0.5 rounded-full tabular-nums">
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-gray-500 dark:text-gray-300 shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-300 shrink-0" aria-hidden />
        )}
      </button>
      {isExpanded && <div className="pb-2.5 pt-0 px-1.5 -mx-0.5">{children}</div>}
    </div>
  )
}

// ============================================================================
// Checkbox Component
// ============================================================================

interface CheckboxItemProps {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  count?: number | undefined
  price?: string | undefined
  disabled?: boolean | undefined
  icon?: React.ReactNode | undefined
}

function CheckboxItem({ id, label, checked, onChange, count, price, disabled, icon }: CheckboxItemProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-2 py-1.5 px-1.5 rounded-md cursor-pointer transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50'}
        ${checked ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      {/* Custom checkmark box - syncs with native checkbox for a11y */}
      <span
        className={`flex items-center justify-center shrink-0 w-4 h-4 rounded border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1
          ${checked
            ? 'bg-primary border-primary text-primary-foreground'
            : 'bg-background border-input dark:border-white/20 dark:bg-white/5'}`}
        aria-hidden
      >
        {checked && <Check className="h-2.5 w-2.5 stroke-[2.5]" />}
      </span>
      {icon && <span className="flex-shrink-0 [&_svg]:size-4">{icon}</span>}
      <span className="flex-1 text-xs font-medium text-gray-900 dark:text-gray-200 truncate min-w-0">{label}</span>
      {count !== undefined && (
        <span className="text-[11px] text-gray-500 dark:text-gray-300 tabular-nums shrink-0">({count})</span>
      )}
      {price && (
        <span className="text-[11px] font-semibold text-primary tabular-nums shrink-0">{price}</span>
      )}
    </label>
  )
}

// ============================================================================
// Range Slider Component
// ============================================================================

interface RangeSliderProps {
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  formatValue?: (value: number) => string
  step?: number
  label?: { min: string; max: string }
}

function RangeSlider({ min, max, value, onChange, formatValue, step = 1, label }: RangeSliderProps) {
  const format = formatValue || ((v: number) => v.toString())
  
  // Sanitize inputs - ensure min < max and values are within bounds
  const safeMin = Math.min(min, max)
  const safeMax = Math.max(min, max)
  const range = safeMax - safeMin || 1 // Prevent division by zero
  
  // Clamp values to be within range
  const localMin = Math.max(safeMin, Math.min(value[0], safeMax))
  const localMax = Math.max(safeMin, Math.min(value[1], safeMax))

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localMax - step)
    onChange([Math.max(safeMin, newMin), localMax])
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localMin + step)
    onChange([localMin, Math.min(safeMax, newMax)])
  }

  // Calculate positions for the colored track (with safety for edge cases)
  const minPercent = Math.max(0, Math.min(100, ((localMin - safeMin) / range) * 100))
  const maxPercent = Math.max(0, Math.min(100, ((localMax - safeMin) / range) * 100))

  // Don't render if range is invalid
  if (safeMin >= safeMax || !isFinite(safeMin) || !isFinite(safeMax)) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-300 text-center py-2">
        No range data available
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {/* Value Display */}
      <div className="flex justify-between gap-1">
        <div className="min-w-0 flex-1 text-center">
          <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">{label?.min || 'Min'}</div>
          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums mt-0.5 truncate">{format(localMin)}</div>
        </div>
        <div className="min-w-0 flex-1 text-center">
          <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">{label?.max || 'Max'}</div>
          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums mt-0.5 truncate">{format(localMax)}</div>
        </div>
      </div>

      {/* Dual Range Slider */}
      <div className="relative h-5 flex items-center">
        {/* Track Background */}
        <div className="absolute w-full h-1 bg-gray-200 dark:bg-white/20 rounded-full" />
        
        {/* Active Track */}
        <div
          className="absolute h-1 bg-primary rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Min Slider */}
        <input
          type="range"
          min={safeMin}
          max={safeMax}
          step={step}
          value={localMin}
          onChange={handleMinChange}
          className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 
            [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform
            [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary 
            [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:cursor-pointer"
        />

        {/* Max Slider */}
        <input
          type="range"
          min={safeMin}
          max={safeMax}
          step={step}
          value={localMax}
          onChange={handleMaxChange}
          className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 
            [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform
            [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary 
            [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>
    </div>
  )
}

// ============================================================================
// Time Slot Button Component
// ============================================================================

interface TimeSlotButtonProps {
  slots: { value: TimeSlot; label: string; icon: React.ReactNode }[]
  selected: TimeSlot[]
  onChange: (selected: TimeSlot[]) => void
}

function TimeSlotButtons({ slots, selected, onChange }: TimeSlotButtonProps) {
  const toggleSlot = (slot: TimeSlot) => {
    if (selected.includes(slot)) {
      onChange(selected.filter((s) => s !== slot))
    } else {
      onChange([...selected, slot])
    }
  }

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {slots.map((slot) => (
        <button
          key={slot.value}
          type="button"
          onClick={() => toggleSlot(slot.value)}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-md border transition-colors text-[11px] font-medium
            ${
              selected.includes(slot.value)
                ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20 dark:border-primary/70'
                : 'bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-primary/40 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
          <span className="mb-0.5 [&_svg]:size-3.5">{slot.icon}</span>
          <span>{slot.label}</span>
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// Layover Time Buttons
// ============================================================================

interface LayoverTimeButtonsProps {
  options: { value: LayoverTime; label: string }[]
  selected: LayoverTime[]
  onChange: (selected: LayoverTime[]) => void
}

function LayoverTimeButtons({ options, selected, onChange }: LayoverTimeButtonsProps) {
  const toggleOption = (option: LayoverTime) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => toggleOption(option.value)}
          className={`py-2 px-1.5 rounded-md border transition-colors text-[11px] font-medium
            ${
              selected.includes(option.value)
                ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20 dark:border-primary/70'
                : 'bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-primary/40 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// Main Filter Sidebar Component
// ============================================================================

export function FlightFilterSidebar({
  filters,
  onFiltersChange,
  priceRange = { min: 0, max: 100000 },
  durationRange = { min: 0, max: 2400 }, // max 40 hours in minutes
  airlines = [],
  layoverAirports = [],
  allianceOptions = [],
  stopsOptions = [],
  isMobileOpen = false,
  onMobileClose,
  className = '',
}: FlightFilterSidebarProps) {
  // ============================================================================
  // Filter Handlers
  // ============================================================================

  const handleStopsChange = useCallback(
    (stop: StopFilter, checked: boolean) => {
      const newStops = checked
        ? [...filters.stops, stop]
        : filters.stops.filter((s) => s !== stop)
      onFiltersChange({ ...filters, stops: newStops })
    },
    [filters, onFiltersChange]
  )

  const handleRefundableChange = useCallback(
    (checked: boolean) => {
      onFiltersChange({ ...filters, refundableOnly: checked })
    },
    [filters, onFiltersChange]
  )

  const handlePriceRangeChange = useCallback(
    (value: [number, number]) => {
      onFiltersChange({ ...filters, priceRange: { min: value[0], max: value[1] } })
    },
    [filters, onFiltersChange]
  )

  const handleDurationRangeChange = useCallback(
    (value: [number, number]) => {
      onFiltersChange({ ...filters, durationRange: { min: value[0], max: value[1] } })
    },
    [filters, onFiltersChange]
  )

  const handleDepartureTimeChange = useCallback(
    (selected: TimeSlot[]) => {
      onFiltersChange({ ...filters, departureTimeSlots: selected })
    },
    [filters, onFiltersChange]
  )

  const handleLayoverTimeChange = useCallback(
    (selected: LayoverTime[]) => {
      onFiltersChange({ ...filters, layoverTime: selected })
    },
    [filters, onFiltersChange]
  )

  const handleAllianceChange = useCallback(
    (alliance: Alliance, checked: boolean) => {
      const newAlliances = checked
        ? [...filters.alliances, alliance]
        : filters.alliances.filter((a) => a !== alliance)
      onFiltersChange({ ...filters, alliances: newAlliances })
    },
    [filters, onFiltersChange]
  )

  const handleAirlineChange = useCallback(
    (airlineCode: string, checked: boolean) => {
      const newAirlines = checked
        ? [...filters.airlines, airlineCode]
        : filters.airlines.filter((a) => a !== airlineCode)
      onFiltersChange({ ...filters, airlines: newAirlines })
    },
    [filters, onFiltersChange]
  )

  const handleLayoverAirportChange = useCallback(
    (airportCode: string, checked: boolean) => {
      const newAirports = checked
        ? [...filters.layoverAirports, airportCode]
        : filters.layoverAirports.filter((a) => a !== airportCode)
      onFiltersChange({ ...filters, layoverAirports: newAirports })
    },
    [filters, onFiltersChange]
  )

  const handleResetFilters = useCallback(() => {
    onFiltersChange({
      ...defaultFilters,
      priceRange,
      durationRange,
    })
  }, [onFiltersChange, priceRange, durationRange])

  // ============================================================================
  // Time Slot Icons
  // ============================================================================

  const timeSlots: { value: TimeSlot; label: string; icon: React.ReactNode }[] = [
    {
      value: '00-06',
      label: '00-06',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
    },
    {
      value: '06-12',
      label: '06-12',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ),
    },
    {
      value: '12-18',
      label: '12-18',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ),
    },
    {
      value: '18-24',
      label: '18-00',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
    },
  ]

  const layoverTimeOptions: { value: LayoverTime; label: string }[] = [
    { value: '0h-5h', label: '0h-5h' },
    { value: '5h-10h', label: '5h-10h' },
    { value: '10h-15h', label: '10h-15h' },
    { value: '15h+', label: '15h+' },
  ]

  // Default stops options if not provided
  const defaultStopsOptions: { value: StopFilter; label: string; count: number }[] = [
    { value: 'non-stop', label: 'Non-Stop', count: 0 },
    { value: '1-stop', label: '1 Stop', count: 0 },
    { value: '2-plus', label: '2+ Stops', count: 0 },
  ]

  const activeStopsOptions = stopsOptions.length > 0 ? stopsOptions : defaultStopsOptions

  // Default alliance options if not provided
  const defaultAllianceOptions: AllianceFilterOption[] = [
    { value: 'Star Alliance', label: 'Star Alliance', count: 0 },
    { value: 'Oneworld', label: 'Oneworld', count: 0 },
    { value: 'SkyTeam', label: 'SkyTeam', count: 0 },
  ]

  const activeAllianceOptions = allianceOptions.length > 0 ? allianceOptions : defaultAllianceOptions

  // Count active filters
  const activeFilterCount =
    filters.stops.length +
    (filters.refundableOnly ? 1 : 0) +
    filters.departureTimeSlots.length +
    filters.layoverTime.length +
    filters.alliances.length +
    filters.airlines.length +
    filters.layoverAirports.length +
    (filters.priceRange.min > priceRange.min || filters.priceRange.max < priceRange.max ? 1 : 0) +
    (filters.durationRange.min > durationRange.min || filters.durationRange.max < durationRange.max ? 1 : 0)

  // ============================================================================
  // Render
  // ============================================================================

  const sidebarContent = (
    <div>
      {/* Header - compact */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200/80 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary shrink-0" aria-hidden />
          <h2 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">Filters</h2>
          {activeFilterCount > 0 && (
            <span className="text-[10px] font-medium bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full tabular-nums min-w-[1.125rem] text-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors rounded py-1 px-1.5 -mr-0.5"
            >
              <RotateCcw className="h-3 w-3" aria-hidden />
              <span>Reset</span>
            </button>
          )}
          {onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="sidebar-expanded:hidden p-1.5 rounded-md hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-300 hover:text-gray-100"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Sections - compact padding */}
      <div className="px-3 py-2 space-y-0">
        {/* Stops Filter */}
        <FilterSection title="Stops" badge={filters.stops.length || undefined}>
          <div className="space-y-0.5">
            {activeStopsOptions.map((option) => (
              <CheckboxItem
                key={option.value}
                id={`stop-${option.value}`}
                label={option.label}
                checked={filters.stops.includes(option.value)}
                onChange={(checked) => handleStopsChange(option.value, checked)}
                count={option.count}
              />
            ))}
          </div>
        </FilterSection>

        {/* Refundable Filter */}
        <FilterSection title="Refundable" badge={filters.refundableOnly ? 1 : undefined}>
          <CheckboxItem
            id="refundable-only"
            label="Refundable tickets only"
            checked={filters.refundableOnly}
            onChange={handleRefundableChange}
          />
        </FilterSection>

        {/* Price Range Filter */}
        <FilterSection title="Price Range">
          <RangeSlider
            min={priceRange.min}
            max={priceRange.max}
            value={[
              filters.priceRange.min === 0 ? priceRange.min : filters.priceRange.min,
              filters.priceRange.max === Infinity ? priceRange.max : filters.priceRange.max,
            ]}
            onChange={handlePriceRangeChange}
            formatValue={(v) => formatPrice(v)}
            step={100}
            label={{ min: 'Minimum Price', max: 'Maximum Price' }}
          />
        </FilterSection>

        {/* Duration Filter */}
        <FilterSection title="By Duration">
          <RangeSlider
            min={durationRange.min}
            max={durationRange.max}
            value={[
              filters.durationRange.min === 0 ? durationRange.min : filters.durationRange.min,
              filters.durationRange.max === Infinity ? durationRange.max : filters.durationRange.max,
            ]}
            onChange={handleDurationRangeChange}
            formatValue={formatDuration}
            step={30}
            label={{ min: 'Minimum Time', max: 'Maximum Time' }}
          />
        </FilterSection>

        {/* Departure Time Filter */}
        <FilterSection title="Departure Time" badge={filters.departureTimeSlots.length || undefined}>
          <TimeSlotButtons
            slots={timeSlots}
            selected={filters.departureTimeSlots}
            onChange={handleDepartureTimeChange}
          />
        </FilterSection>

        {/* Layover Time Filter */}
        <FilterSection title="Layover Time" badge={filters.layoverTime.length || undefined}>
          <LayoverTimeButtons
            options={layoverTimeOptions}
            selected={filters.layoverTime}
            onChange={handleLayoverTimeChange}
          />
        </FilterSection>

        {/* Alliances Filter */}
        <FilterSection title="Alliances" badge={filters.alliances.length || undefined}>
          <div className="space-y-0.5">
            {activeAllianceOptions.map((option) => (
              <CheckboxItem
                key={option.value}
                id={`alliance-${option.value}`}
                label={option.label}
                checked={filters.alliances.includes(option.value)}
                onChange={(checked) => handleAllianceChange(option.value, checked)}
                count={option.count}
                icon={<AllianceLogo alliance={option.value} size={16} />}
              />
            ))}
          </div>
        </FilterSection>

        {/* Airlines Filter - Only show if we have airline data */}
        {airlines.length > 0 && (
          <FilterSection title="Airlines" badge={filters.airlines.length || undefined}>
            <div className="space-y-0.5 max-h-36 overflow-y-auto">
              {airlines.map((airline) => (
                <CheckboxItem
                  key={airline.code}
                  id={`airline-${airline.code}`}
                  label={airline.label}
                  checked={filters.airlines.includes(airline.code)}
                  onChange={(checked) => handleAirlineChange(airline.code, checked)}
                  count={airline.count}
                  icon={
                    <AirlineLogo
                      airlineId={airline.code}
                      size={16}
                      className="rounded"
                    />
                  }
                />
              ))}
            </div>
          </FilterSection>
        )}

        {/* Layover Airports Filter - Only show if we have airport data */}
        {layoverAirports.length > 0 && (
          <FilterSection title="Layover Airports" badge={filters.layoverAirports.length || undefined}>
            <div className="space-y-0.5 max-h-36 overflow-y-auto">
              {layoverAirports.map((airport) => (
                <CheckboxItem
                  key={airport.code}
                  id={`airport-${airport.code}`}
                  label={airport.name}
                  checked={filters.layoverAirports.includes(airport.code)}
                  onChange={(checked) => handleLayoverAirportChange(airport.code, checked)}
                  count={airport.count}
                  price={airport.price ? formatPrice(airport.price) : undefined}
                />
              ))}
            </div>
          </FilterSection>
        )}
      </div>
    </div>
  )

  // Overlay (mobile + 1024–1366): filter bar collapsed, open as overlay when Filters clicked
  if (isMobileOpen) {
    return (
      <>
        {/* Backdrop - hidden only at sidebar-expanded (1367px+) */}
        <div
          className="fixed inset-0 bg-black/50 z-40 sidebar-expanded:hidden"
          onClick={onMobileClose}
        />
        {/* Sidebar - overlay below header; hidden at 1367px+ where desktop sidebar shows */}
        <div
          className={`fixed top-14 bottom-0 left-0 w-64 max-w-[85vw] bg-white dark:bg-neutral-950 z-50 sidebar-expanded:hidden 
            shadow-xl rounded-r-xl border-r border-gray-200/80 dark:border-white/10 overflow-y-auto ${className}`}
        >
          {sidebarContent}
        </div>
      </>
    )
  }

  // Desktop sidebar - only visible from 1367px+ (1024–1366 keeps filter bar collapsed); compact width
  return (
    <div
      className={`hidden sidebar-expanded:block w-64 flex-shrink-0 bg-white dark:bg-neutral-950 border-r 
        border-gray-200/80 dark:border-white/10 shadow-sm ${className}`}
    >
      {sidebarContent}
    </div>
  )
}
