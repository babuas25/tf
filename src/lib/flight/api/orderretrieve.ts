import http from 'http'
import https from 'https'

import { getBdfareBaseUrl, isBdfareHttps } from '@/lib/flight/bdfare-config'
import type { OrderCreateApiResponse } from '@/types/flight/api/order.types'

/**
 * Call BDFare OrderRetrieve and return parsed response (for server use).
 */
export async function fetchOrderRetrieve(orderReference: string): Promise<OrderCreateApiResponse> {
  const API_BASE = getBdfareBaseUrl()
  const useHttps = isBdfareHttps()
  const auth = Buffer.from(
    `${process.env.NEXT_PUBLIC_BDFARE_USERNAME || 'superadmin'}:${process.env.NEXT_PUBLIC_BDFARE_PASSWORD || '123456789'}`
  ).toString('base64')

  const postData = JSON.stringify({ orderReference })
  const url = new URL(API_BASE.replace(/\/$/, '') + '/OrderRetrieve')
  const defaultPort = useHttps ? 443 : 80
  const port = url.port ? parseInt(url.port, 10) : defaultPort
  const options: http.RequestOptions = {
    hostname: url.hostname,
    port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      Authorization: `Basic ${auth}`,
    },
    ...(useHttps && { rejectUnauthorized: false }),
  }

  const requestModule = useHttps ? https : http
  return new Promise((resolve, reject) => {
    const req = requestModule.request(options, (res) => {
      let data = ''
      res.on('data', (chunk: Buffer | string) => {
        data += typeof chunk === 'string' ? chunk : chunk.toString()
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as OrderCreateApiResponse)
        } catch {
          reject(new Error(`Failed to parse OrderRetrieve response: ${data.slice(0, 200)}`))
        }
      })
    })
    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}
