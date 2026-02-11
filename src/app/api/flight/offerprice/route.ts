import http from 'http'
import https from 'https'

import { NextRequest, NextResponse } from 'next/server'

import { getBdfareBaseUrl, isBdfareHttps } from '@/lib/flight/bdfare-config'

const USERNAME = process.env.NEXT_PUBLIC_BDFARE_USERNAME || 'superadmin'
const PASSWORD = process.env.NEXT_PUBLIC_BDFARE_PASSWORD || '123456789'

export interface OfferPriceRequest {
  traceId: string
  offerId: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Get the request body with better error handling
    let body: OfferPriceRequest
    try {
      const text = await request.text()
      
      if (!text.trim()) {
        throw new Error('Request body is empty')
      }
      
      body = JSON.parse(text) as OfferPriceRequest
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json(
        {
          success: false,
          error: {
            errorCode: 'INVALID_JSON',
            errorMessage: `Invalid JSON in request body: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          },
        },
        { status: 400 }
      )
    }
    
    console.log('🔍 OfferPrice proxy received parsed request:', body)
    console.log('📋 Request details:', {
      traceId: body.traceId,
      offerIds: body.offerId,
      offerIdCount: body.offerId?.length,
      firstOfferId: body.offerId?.[0]
    })

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

    console.log('📡 Sending request to BDFare OfferPrice API...')

    const responseData: unknown = await new Promise((resolve, reject) => {
      const url = new URL(API_BASE_URL.replace(/\/$/, '') + '/OfferPrice')
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
    console.log('✅ OfferPrice response received:', isSuccess ? 'Success' : 'Failed')
    console.log('📊 Backend response data:', responseData)

    // Return the response
    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    console.error('❌ OfferPrice proxy error:', error)
    console.error('Error details:', error instanceof Error ? error.stack : error)
    return NextResponse.json(
      {
        success: false,
        error: {
          errorCode: 'PROXY_ERROR',
          errorMessage: error instanceof Error ? error.message : 'Failed to fetch offer price data',
        },
      },
      { status: 500 }
    )
  }
}
