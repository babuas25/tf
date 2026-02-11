/**
 * BDFare API config: uses APP_ENV (or NODE_ENV) to choose HTTP (development) or HTTPS (production).
 * Set APP_ENV=development for local (HTTP), APP_ENV=production for live API (HTTPS).
 */

const rawBase =
  process.env.NEXT_PUBLIC_BDFARE_API_URL || 'https://localhost:8443'
const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase()
const isProduction = appEnv === 'production'

/** Scheme for BDFare API: http in development, https in production */
const scheme = isProduction ? 'https' : 'http'

/**
 * Parse a base URL that may or may not include a scheme (e.g. "localhost:8080" or "https://api.example.com").
 */
function parseBaseUrl(input: string): { hostname: string; port: string } {
  const trimmed = input.trim().replace(/\/+$/, '')
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const url = new URL(trimmed)
    return { hostname: url.hostname, port: url.port }
  }
  const [host, portPart] = trimmed.split(':')
  return {
    hostname: host || 'localhost',
    port: portPart || (isProduction ? '443' : '80'),
  }
}

/**
 * Base URL for BDFare API with scheme set from APP_ENV:
 * - development → http (e.g. http://localhost:8080)
 * - production  → https (e.g. https://api.tripfeels.com)
 */
export function getBdfareBaseUrl(): string {
  const { hostname, port } = parseBaseUrl(rawBase)
  const defaultPort = isProduction ? 443 : 80
  const portNum = port ? parseInt(port, 10) : defaultPort
  const portSuffix =
    (isProduction && portNum === 443) || (!isProduction && portNum === 80)
      ? ''
      : `:${portNum}`
  return `${scheme}://${hostname}${portSuffix}`
}

/** Whether outbound BDFare requests should use HTTPS (true in production). */
export function isBdfareHttps(): boolean {
  return isProduction
}

/** Current app environment: development | production */
export function getAppEnv(): 'development' | 'production' {
  return isProduction ? 'production' : 'development'
}
