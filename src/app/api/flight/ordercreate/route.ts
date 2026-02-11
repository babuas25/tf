import http from 'http'
import https from 'https'

import { NextRequest, NextResponse } from 'next/server'

import { getBdfareBaseUrl, isBdfareHttps } from '@/lib/flight/bdfare-config'

interface OrderCreateRequest {
  traceId: string
  offerId: string[]
  request: {
    contactInfo: {
      phone: {
        phoneNumber: string
        countryDialingCode: string
      }
      emailAddress: string
    }
    paxList: Array<{
      ptc: string
      individual: {
        givenName: string
        surname: string
        gender: string
        birthdate: string
        nationality: string
        identityDoc?: {
          identityDocType: string
          identityDocID: string
          expiryDate: string
        }
        associatePax?: {
          givenName: string
          surname: string
        }
      }
      sellSSR?: Array<{
        ssrRemark?: string | null
        ssrCode: string
        loyaltyProgramAccount?: {
          airlineDesigCode: string
          accountNumber: string
        }
      }>
      travelerAddOnService?: {
        travelerAddOnServiceBaggage?: Array<{ serviceId: string }>
        travelerAddOnServiceMeal?: Array<{ serviceId: string }>
        travelerAddOnServiceSeat?: Array<{ serviceId: string }>
      }
    }>
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OrderCreateRequest

    // Prepare the request body for the external API
    const requestBody = {
      TraceId: body.traceId,
      OfferId: body.offerId,
      request: body.request,
    }

    const API_BASE_URL = getBdfareBaseUrl()
    const useHttps = isBdfareHttps()
    const url = new URL(API_BASE_URL.replace(/\/$/, '') + '/OrderCreate')
    const defaultPort = useHttps ? 443 : 80
    const port = url.port ? parseInt(url.port, 10) : defaultPort
    const auth = Buffer.from(
      `${process.env.NEXT_PUBLIC_BDFARE_USERNAME || 'superadmin'}:${process.env.NEXT_PUBLIC_BDFARE_PASSWORD || '123456789'}`
    ).toString('base64')

    return new Promise<NextResponse>((resolve) => {
      const postData = JSON.stringify(requestBody)

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
      const req = requestModule.request(options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            const jsonResponse = JSON.parse(data) as Record<string, unknown>
            resolve(NextResponse.json(jsonResponse))
          } catch {
            resolve(NextResponse.json({ error: 'Failed to parse API response', rawData: data }, { status: 500 }))
          }
        })
      })

      req.on('error', (error) => {
        console.error('OrderCreate API error:', error)
        resolve(NextResponse.json({ error: 'Failed to fetch from external API', details: error.message }, { status: 500 }))
      })

      req.write(postData)
      req.end()
    })
  } catch (error) {
    console.error('OrderCreate route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
