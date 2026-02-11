import http from 'http'
import https from 'https'

import { NextRequest, NextResponse } from 'next/server'

import { getBdfareBaseUrl, isBdfareHttps } from '@/lib/flight/bdfare-config'

const USERNAME = process.env.NEXT_PUBLIC_BDFARE_USERNAME || 'superadmin'
const PASSWORD = process.env.NEXT_PUBLIC_BDFARE_PASSWORD || '123456789'

export interface FareRulesRequest {
  traceId: string
  offerId: string | string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FareRulesRequest
    console.log('🔍 FareRules proxy received request:', body)

    const offerIds = Array.isArray(body.offerId) ? body.offerId : [body.offerId]
    if (!body.traceId || !body.offerId || offerIds.length === 0 || offerIds.every((id) => !id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorCode: 'INVALID_REQUEST',
            errorMessage: 'traceId and offerId are required',
          },
        },
        { status: 400 }
      )
    }

    // API expects PascalCase properties at root (TraceId, OfferId)
    const requestBody = {
      TraceId: body.traceId,
      OfferId: offerIds[0],
    }
    const API_BASE_URL = getBdfareBaseUrl()
    const useHttps = isBdfareHttps()
    const basicAuth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')
    console.log('📡 Sending request to BDFare FareRules API...')

    const responseData: unknown = await new Promise((resolve, reject) => {
      const url = new URL(API_BASE_URL.replace(/\/$/, '') + '/FareRules')
      const postData = JSON.stringify(requestBody)

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
          Authorization: `Basic ${basicAuth}`,
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
            resolve(JSON.parse(data) as unknown)
          } catch {
            reject(new Error(`Failed to parse response: ${data}`))
          }
        })
      })

      req.on('error', reject)
      req.write(postData)
      req.end()
    })

    const isSuccess =
      typeof responseData === 'object' &&
      responseData !== null &&
      'success' in responseData &&
      (responseData as { success?: boolean }).success === true
    console.log('✅ FareRules response received:', isSuccess ? 'Success' : 'Failed')

    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    console.error('❌ FareRules proxy error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          errorCode: 'PROXY_ERROR',
          errorMessage:
            error instanceof Error ? error.message : 'Failed to fetch fare rules',
        },
      },
      { status: 500 }
    )
  }
}
