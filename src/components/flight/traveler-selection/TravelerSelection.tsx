'use client'

import { ChevronRight, Minus, Plus } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface TravelerData {
  adults: number
  children: number
  infants: number
  travelClass: 'Economy' | 'Business' | 'First Class'
  childrenAges: number[] // Array to store ages of children
}

interface TravelerSelectionProps {
  value: TravelerData
  onChange: (data: TravelerData) => void
  disabled?: boolean
  className?: string
}

export function TravelerSelection({
  value,
  onChange,
  disabled = false,
  className = '',
}: TravelerSelectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempValue, setTempValue] = useState<TravelerData>(value)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalTravelers = value.adults + value.children + value.infants

  // Generate simple passenger count text
  const getPassengerDisplayText = (): string => {
    const total = totalTravelers
    return `${total} Traveler${total > 1 ? 's' : ''}`
  }

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element

      // Don't close if clicking on the trigger button
      if (containerRef.current && containerRef.current.contains(target)) {
        return
      }

      // Don't close if clicking inside the popup
      const popupElement = document.querySelector('[data-popup="traveler-selection"]')
      if (popupElement && popupElement.contains(target)) {
        return
      }

      // Close the popup
      setIsOpen(false)
      setTempValue(value) // Reset temp value if clicking outside
    }

    if (isOpen) {
      // Add event listener after a small delay to prevent immediate closing
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside, true)
      }, 100)

      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('mousedown', handleClickOutside, true)
      }
    }
  }, [isOpen, value])

  const handleTogglePopup = () => {
    if (!disabled) {
      if (!isOpen) {
        setTempValue(value) // Initialize temp value when opening
      }
      setIsOpen(!isOpen)
    }
  }

  const updateTempValue = (field: keyof TravelerData, newValue: number | string | number[]) => {
    setTempValue((prev) => {
      const updated = {
        ...prev,
        [field]: newValue,
      }
      
      // If children count changes, adjust childrenAges array
      if (field === 'children') {
        const childrenCount = newValue as number
        const currentAges = prev.childrenAges || []
        
        if (childrenCount > currentAges.length) {
          // Add default ages for new children
          const newAges = [...currentAges]
          for (let i = currentAges.length; i < childrenCount; i++) {
            newAges.push(2) // Default age 2
          }
          updated.childrenAges = newAges
        } else if (childrenCount < currentAges.length) {
          // Remove excess ages
          updated.childrenAges = currentAges.slice(0, childrenCount)
        }
      }
      
      return updated
    })
  }

  const updateChildAge = (childIndex: number, age: number) => {
    setTempValue((prev) => {
      const newAges = [...(prev.childrenAges || [])]
      newAges[childIndex] = age
      return {
        ...prev,
        childrenAges: newAges,
      }
    })
  }

  const handleDone = () => {
    // Validate the selection before applying
    const isValid = validateSelection(tempValue)

    if (isValid) {
      onChange(tempValue)
      setIsOpen(false)
    }
  }

  // Validation function based on business rules
  const validateSelection = (data: TravelerData): boolean => {
    const { adults, children, infants, childrenAges } = data
    const total = adults + children + infants

    // Rule 1: At least 1 adult required
    if (adults < 1) return false

    // Rule 2: Infants cannot exceed adults (each infant needs an adult)
    if (infants > adults) return false

    // Rule 3: Total passengers cannot exceed 9
    if (total > 9) return false

    // Rule 4: Maximum limits
    if (adults > 9) return false
    if (children > 8) return false
    if (infants > 4) return false

    // Rule 5: If children > 0, all children must have ages selected
    if (children > 0) {
      if (!childrenAges || childrenAges.length !== children) return false
      // Check if all ages are valid (2-11)
      if (childrenAges.some(age => age < 2 || age > 11)) return false
    }

    return true
  }

  // Get validation message for display
  const getValidationMessage = (): string | null => {
    const { adults, children, infants, childrenAges } = tempValue
    const total = adults + children + infants

    if (adults < 1) return 'At least 1 adult is required'
    if (infants > adults) return 'Each infant must be accompanied by an adult'
    if (total > 9) return 'Maximum 9 passengers allowed'
    if (children > 0 && (!childrenAges || childrenAges.length !== children)) {
      return 'Please select age for all children'
    }

    return null
  }

  const handleReset = () => {
    const resetValue: TravelerData = {
      adults: 1,
      children: 0,
      infants: 0,
      travelClass: 'Economy',
      childrenAges: [],
    }
    setTempValue(resetValue)
  }

  const renderNumberSelector = (
    label: string,
    subtitle: string,
    currentValue: number,
    min: number,
    max: number,
    onChange: (value: number) => void,
  ) => {
    // Calculate dynamic limits based on business rules
    let dynamicMin = min
    let dynamicMax = max

    const totalPassengers = tempValue.adults + tempValue.children + tempValue.infants

    if (label === 'Adults') {
      // Adults: Min 1, Max 9, but limited by total passengers
      dynamicMin = 1
      dynamicMax = Math.min(9, 9 - tempValue.children - tempValue.infants)
    } else if (label === 'Children') {
      // Children: Min 0, Max 8, but limited by total passengers and must have at least 1 adult
      dynamicMin = 0
      dynamicMax = Math.min(8, 9 - tempValue.adults - tempValue.infants)
    } else if (label === 'Infants') {
      // Infants: Min 0, Max = number of adults, and limited by total passengers
      dynamicMin = 0
      dynamicMax = Math.min(tempValue.adults, 9 - tempValue.adults - tempValue.children)
    }

    const canDecrement = currentValue > dynamicMin
    const canIncrement = currentValue < dynamicMax && totalPassengers < 9

    return (
      <div className="flex items-center justify-between py-2">
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {label}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newValue = Math.max(dynamicMin, currentValue - 1)

              // Special handling for adults - if reducing adults below infants, reduce infants too
              if (label === 'Adults' && newValue < tempValue.infants) {
                setTempValue((prev) => ({
                  ...prev,
                  adults: newValue,
                  infants: newValue,
                }))
              } else {
                onChange(newValue)
              }
            }}
            disabled={!canDecrement}
            className="h-6 w-6 p-0 rounded-full"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {currentValue}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newValue = Math.min(dynamicMax, currentValue + 1)
              onChange(newValue)
            }}
            disabled={!canIncrement}
            className="h-6 w-6 p-0 rounded-full"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  const renderChildAgeSelector = () => {
    if (tempValue.children === 0) return null

    return (
      <div className="mt-2 p-2 bg-gray-50 dark:bg-neutral-900/50 rounded-md border border-gray-200 dark:border-gray-700">
        <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Select Age for Each Child
        </div>
        <div className="space-y-2">
          {Array.from({ length: tempValue.children }, (_, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-xs text-gray-700 dark:text-gray-300">
                Child {index + 1}
              </span>
              <div className="flex flex-wrap gap-1">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((age) => (
                  <button
                    key={age}
                    type="button"
                    onClick={() => updateChildAge(index, age)}
                    className={cn(
                      'w-6 h-6 text-xs font-medium rounded border transition-colors',
                      (tempValue.childrenAges?.[index] || 2) === age
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-neutral-700'
                    )}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderTravelClassSelector = () => (
    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Travel Class
      </div>
      <div className="grid grid-cols-3 gap-1">
        {(['Economy', 'Business', 'First Class'] as const).map((classType) => (
          <Button
            key={classType}
            type="button"
            variant={tempValue.travelClass === classType ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              updateTempValue('travelClass', classType)
            }}
            className="h-8 text-xs"
          >
            {classType}
          </Button>
        ))}
      </div>
    </div>
  )

  const getPosition = () => {
    if (!containerRef.current) return { left: 0, top: 0 }

    const rect = containerRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const popupWidth = 350
    const popupHeight = 400

    // Always try to position above the trigger first (like AppDashboard)
    let left = rect.left
    let top = rect.top - popupHeight - 8 // Position above with 8px gap

    // Adjust horizontal position if popup would go off screen
    if (left + popupWidth > viewportWidth - 20) {
      left = viewportWidth - popupWidth - 20
    }
    if (left < 20) {
      left = 20
    }

    // If popup would go above viewport, position it to fit
    if (top < window.scrollY + 20) {
      // Not enough space above, try below
      const bottomPosition = rect.bottom + 8
      if (bottomPosition + popupHeight <= window.scrollY + viewportHeight - 20) {
        top = bottomPosition
      } else {
        // Not enough space above or below, position at top of viewport
        top = window.scrollY + 20
      }
    }

    return { left, top }
  }

  const renderPopup = () => {
    if (!isOpen) return null

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1200

    const popupElement = (
      <>
        {/* Backdrop for mobile */}
        {isMobile && (
          <div
            className="fixed inset-0 bg-black/20 z-[9998]"
            onMouseDown={(e) => {
              e.stopPropagation()
              setIsOpen(false)
              setTempValue(value) // Reset temp value when clicking backdrop
            }}
          />
        )}

        <Card
          className="fixed p-3 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-white/10 shadow-lg z-[9999] w-[calc(100vw-32px)] max-w-[350px] max-h-[calc(100vh-80px)] overflow-y-auto"
          style={getPosition()}
          data-popup="traveler-selection"
          onMouseDown={(e) => e.stopPropagation()} // Prevent mousedown from bubbling
          onClick={(e) => e.stopPropagation()} // Prevent click from bubbling
        >
          {/* Passenger Summary */}
          <div className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Select Passengers
              </h3>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {tempValue.adults + tempValue.children + tempValue.infants}/9 passengers
              </div>
            </div>
          </div>

          <div className="space-y-1">
            {renderNumberSelector(
              'Adults',
              'ADT (12+ Years or above)',
              tempValue.adults,
              1, // Min adults
              9, // Max adults (will be dynamically limited)
              (newValue) => updateTempValue('adults', newValue),
            )}

            {renderNumberSelector(
              'Children',
              'CHD (2-11 Years)',
              tempValue.children,
              0, // Min children
              8, // Max children (will be dynamically limited)
              (newValue) => updateTempValue('children', newValue),
            )}

            {/* Child Age Selection - appears when children > 0 */}
            {renderChildAgeSelector()}

            {renderNumberSelector(
              'Infants',
              'INF (0-2 Years)',
              tempValue.infants,
              0, // Min infants
              4, // Max infants (will be dynamically limited by adults count)
              (newValue) => updateTempValue('infants', newValue),
            )}

            {renderTravelClassSelector()}

            {/* Validation Message */}
            {getValidationMessage() && (
              <div className="pt-1 pb-1">
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded border border-red-200 dark:border-red-800">
                  {getValidationMessage()}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleReset()
              }}
              className="flex-1 h-8 text-sm"
            >
              Reset
            </Button>
            <Button
              type="button"
              onClick={() => {
                handleDone()
              }}
              disabled={!validateSelection(tempValue)}
              className={cn(
                'flex-1 h-8 text-sm',
                validateSelection(tempValue)
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed',
              )}
            >
              Done
            </Button>
          </div>
        </Card>
      </>
    )

    return createPortal(popupElement, document.body)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleTogglePopup}
        disabled={disabled}
        className={cn(
          'relative rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-3 lg:px-4 lg:py-7 min-h-[90px] lg:min-h-[110px] flex-[7] flex flex-col justify-center w-full text-left transition-colors hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40',
          disabled && 'opacity-60 cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5',
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] lg:text-[11px] text-gray-600 dark:text-gray-400 mb-1">
              {getPassengerDisplayText()}
            </div>
            <div className="text-sm lg:text-base font-bold text-gray-900 dark:text-gray-100">
              {value.travelClass}
            </div>
          </div>
          <div className="flex-shrink-0">
            <ChevronRight className="h-4 w-4 font-bold text-primary rotate-90" />
          </div>
        </div>
      </button>

      {renderPopup()}
    </div>
  )
}
