// Format duration in minutes to human-readable string
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins}m`
  }

  if (mins === 0) {
    return `${hours}h`
  }

  return `${hours}h ${mins}m`
}

// Calculate total flight duration including layovers
export function calculateTotalDuration(segments: { duration: number; layover?: { duration: number } }[]): number {
  return segments.reduce((total, segment) => {
    let duration = segment.duration
    if (segment.layover) {
      duration += segment.layover.duration
    }
    return total + duration
  }, 0)
}
