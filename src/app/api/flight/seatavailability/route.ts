import http from 'http'
import https from 'https'

import { NextRequest, NextResponse } from 'next/server'

import { getBdfareBaseUrl, isBdfareHttps } from '@/lib/flight/bdfare-config'

const USERNAME = process.env.NEXT_PUBLIC_BDFARE_USERNAME || 'superadmin'
const PASSWORD = process.env.NEXT_PUBLIC_BDFARE_PASSWORD || '123456789'

export interface SeatAvailabilityRequest {
  traceId: string
  offerId: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SeatAvailabilityRequest
    console.log('🪑 SeatAvailability proxy received request:', body)

    if (!body.traceId || !body.offerId || body.offerId.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorCode: 'INVALID_REQUEST',
            errorMessage: 'traceId and offerId array are required',
          },
        },
        { status: 400 }
      )
    }

    const API_BASE_URL = getBdfareBaseUrl()
    const useHttps = isBdfareHttps()
    const basicAuth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')
    console.log('🔐 Auth configured for:', API_BASE_URL, `(${useHttps ? 'HTTPS' : 'HTTP'})`)

    const responseData: unknown = await new Promise((resolve, reject) => {
      const url = new URL(API_BASE_URL.replace(/\/$/, '') + '/SeatAvailability')
      const postData = JSON.stringify(body)

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
          'Authorization': `Basic ${basicAuth}`,
        },
        ...(useHttps && { rejectUnauthorized: false }),
      }

      const requestModule = useHttps ? https : http
      const req = requestModule.request(options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            const jsonData: unknown = JSON.parse(data)
            resolve(jsonData)
          } catch (_error) {
            reject(new Error(`Failed to parse response: ${data}`))
          }
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.write(postData)
      req.end()
    })

    const isSuccess = typeof responseData === 'object' && responseData !== null && 'success' in responseData
    console.log('✅ SeatAvailability response received:', isSuccess ? 'Success' : 'Failed')

    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    console.error('❌ SeatAvailability proxy error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          errorCode: 'PROXY_ERROR',
          errorMessage: error instanceof Error ? error.message : 'Failed to fetch seat availability',
        },
      },
      { status: 500 }
    )
  }
}
