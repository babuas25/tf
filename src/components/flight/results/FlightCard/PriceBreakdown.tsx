'use client'

import { formatPrice } from '@/lib/flight/utils/price-formatter'
import type { FlightPricing } from '@/types/flight/domain/flight-offer.types'

interface PriceBreakdownProps {
  pricing: FlightPricing
}

export function PriceBreakdown({ pricing }: PriceBreakdownProps) {
  // Calculate the total from individual amounts (before discount)
  const calculatedTotal = pricing.perPassenger.reduce((sum, pax) => {
    const amountPerPax = (pax.baseFare || 0) + (pax.taxes || 0) + (pax.vat || 0) + (pax.otherFee || 0)
    return sum + (amountPerPax * pax.count)
  }, 0)

  return (
    <div className="space-y-4">

      {/* Price Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300 dark:border-gray-600">
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                Passenger Type
              </th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                Base Fare
              </th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                Tax
              </th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                Other
              </th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                AIT VAT
              </th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                Pax Count
              </th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {pricing.perPassenger.map((pax, index) => {
              // Correct formula (ignoring discount): (baseFare + tax + vat + otherFee) * paxCount
              // Add proper null/undefined handling to prevent NaN
              const amountPerPax = (pax.baseFare || 0) + (pax.taxes || 0) + (pax.vat || 0) + (pax.otherFee || 0)
              const totalAmount = amountPerPax * pax.count
              
              return (
                <tr
                  key={index}
                  className="border-b border-gray-200 dark:border-gray-700"
                >
                  <td className="py-2 px-3 text-sm text-gray-900 dark:text-white font-medium">
                    {pax.type}
                  </td>
                  <td className="py-2 px-3 text-right text-sm text-gray-700 dark:text-gray-300">
                    {pax.baseFare.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-sm text-gray-700 dark:text-gray-300">
                    {pax.taxes.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-sm text-gray-700 dark:text-gray-300">
                    {pax.otherFee || 0}
                  </td>
                  <td className="py-2 px-3 text-right text-sm text-gray-700 dark:text-gray-300">
                    {pax.vat || 0}
                  </td>
                  <td className="py-2 px-3 text-center text-sm text-gray-700 dark:text-gray-300">
                    {pax.count}
                  </td>
                  <td className="py-2 px-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    {formatPrice(totalAmount, pricing.currency)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Total Price */}
      <div className="flex justify-end items-center gap-3 pt-3">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Total Price:
        </span>
        <span className="text-xl font-bold text-gray-900 dark:text-white">
          {formatPrice(calculatedTotal, pricing.currency)}
        </span>
      </div>
    </div>
  )
}
