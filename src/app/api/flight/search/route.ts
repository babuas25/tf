import http from 'http'
import https from 'https'

import { NextRequest, NextResponse } from 'next/server'

import { getBdfareBaseUrl, getAppEnv, isBdfareHttps } from '@/lib/flight/bdfare-config'

const USERNAME = process.env.NEXT_PUBLIC_BDFARE_USERNAME || 'superadmin'
const PASSWORD = process.env.NEXT_PUBLIC_BDFARE_PASSWORD || '123456789'

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body: unknown = await request.json()
    console.log('🔍 Flight search proxy received request')

    const API_BASE_URL = getBdfareBaseUrl()
    const appEnv = getAppEnv()
    const useHttps = isBdfareHttps()

    // Create Basic Auth header
    const basicAuth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')
    console.log('🔐 Auth configured for:', API_BASE_URL, `(${appEnv} → ${useHttps ? 'HTTPS' : 'HTTP'})`)

    console.log('📡 Sending request to BDFare API...')
    
    const responseData: unknown = await new Promise((resolve, reject) => {
      const url = new URL(API_BASE_URL.replace(/\/$/, '') + '/AirShopping')
      const postData = JSON.stringify(body)

      // Port from URL or default 443 (HTTPS) / 80 (HTTP) per APP_ENV
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

      const timeoutMs = 60000 // 60s - AirShopping can be slow
      const requestModule = useHttps ? https : http
      const req = requestModule.request(options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          clearTimeout(timeoutId)
          try {
            const jsonData: unknown = JSON.parse(data)
            resolve(jsonData)
          } catch (_error) {
            reject(new Error(`Failed to parse response: ${data}`))
          }
        })
      })

      const timeoutId = setTimeout(() => {
        req.destroy()
        reject(new Error(`Flight search request timed out after ${timeoutMs / 1000}s`))
      }, timeoutMs)

      req.on('error', (error) => {
        clearTimeout(timeoutId)
        reject(error)
      })

      req.write(postData)
      req.end()
    })

    const isSuccess = typeof responseData === 'object' && responseData !== null && 'success' in responseData
    console.log('✅ Response data received:', isSuccess ? 'Success' : 'Failed')

    // Return the response
    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    console.error('❌ Flight search proxy error:', error)
    console.error('Error details:', error instanceof Error ? error.stack : error)
    return NextResponse.json(
      {
        success: false,
        error: {
          errorCode: 'PROXY_ERROR',
          errorMessage: error instanceof Error ? error.message : 'Failed to fetch flight data',
        },
      },
      { status: 500 }
    )
  }
}
