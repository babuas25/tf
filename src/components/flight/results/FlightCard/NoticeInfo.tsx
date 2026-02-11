'use client'

import { Clock, FileText, AlertTriangle } from 'lucide-react'

export function NoticeInfo() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Notice
      </h3>

      {/* Reporting & Check-in Time */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h4 className="font-semibold text-red-900 dark:text-red-100">
            Reporting & Check-in Time
          </h4>
        </div>
        <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
          <li className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 font-bold">•</span>
            <span>Please arrive at the airport at least 3 hours before departure for international flights</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 font-bold">•</span>
            <span>Check-in counter closes 1 hour before departure</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 font-bold">•</span>
            <span>Boarding gate closes 30 minutes before departure</span>
          </li>
        </ul>
      </div>

      {/* Required Travel Documents */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
            Required Travel Documents
          </h4>
        </div>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
            <span>Valid passport with minimum 6 months validity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
            <span>Valid visa (if required)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
            <span>Printed or digital copy of your e-ticket</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
            <span>Any required health documents or certificates</span>
          </li>
        </ul>
      </div>

      {/* Prohibited Items */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
            Prohibited Items
          </h4>
        </div>
        <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 dark:text-yellow-400 font-bold">•</span>
            <span>Weapons and firearms</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 dark:text-yellow-400 font-bold">•</span>
            <span>Explosives and flammable items</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 dark:text-yellow-400 font-bold">•</span>
            <span>Sharp objects and tools</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 dark:text-yellow-400 font-bold">•</span>
            <span>Liquids over 100ml in carry-on baggage</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 dark:text-yellow-400 font-bold">•</span>
            <span>Compressed gases and toxic substances</span>
          </li>
        </ul>
      </div>

      {/* Additional Notice */}
      <div className="flex items-start gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <p className="font-medium mb-1">Important Information:</p>
          <p>
            Airline policies and restrictions may vary. Please check with the airline for specific requirements and latest updates before your flight.
          </p>
        </div>
      </div>
    </div>
  )
}
