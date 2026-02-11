import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to safely convert Firebase timestamp to readable date
export function formatFirebaseTimestamp(timestamp: unknown): string {
  if (!timestamp) return 'Not available'

  try {
    // Handle Firebase Timestamp object (from API response)
    if (
      typeof timestamp === 'object' &&
      timestamp !== null &&
      'seconds' in (timestamp as Record<string, unknown>)
    ) {
      const seconds = (timestamp as Record<string, unknown>).seconds
      if (typeof seconds === 'number') {
        return new Date(seconds * 1000).toLocaleDateString()
      }
    }

    // Handle direct Date object
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString()
    }

    // Handle string timestamp
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString()
      }
    }

    // Handle number timestamp (milliseconds)
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleDateString()
    }

    return 'Not available'
  } catch (error) {
    console.error('Error formatting timestamp:', error, timestamp)
    return 'Invalid Date'
  }
}
