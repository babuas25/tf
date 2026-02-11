// Format ISO date to display format
export function formatFlightDate(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    // Use Asia/Dhaka timezone for Bangladesh domestic flights
    // Format: "Thursday, Mar 26"
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC'
    }
    return new Intl.DateTimeFormat('en-US', options).format(date)
  } catch {
    return isoDate
  }
}

export function formatFlightTime(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    // Use Asia/Dhaka timezone (UTC+6) for Bangladesh flights
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    }
    const timeStr = new Intl.DateTimeFormat('en-GB', options).format(date)
    return timeStr
  } catch {
    return isoDate
  }
}

export function formatFullDateTime(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    }
    return new Intl.DateTimeFormat('en-US', options).format(date)
  } catch {
    return isoDate
  }
}
