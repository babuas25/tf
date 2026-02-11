import http from 'http'
import https from 'https'

import { NextRequest, NextResponse } from 'next/server'

import { getBdfareBaseUrl, isBdfareHttps } from '@/lib/flight/bdfare-config'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { orderReference: string }
    if (!body?.orderReference) {
      return NextResponse.json({ success: false, error: { errorMessage: 'orderReference is required' } }, { status: 400 })
    }

    const API_BASE = getBdfareBaseUrl()
    const useHttps = isBdfareHttps()
    const auth = Buffer.from(
      `${process.env.NEXT_PUBLIC_BDFARE_USERNAME || 'superadmin'}:${process.env.NEXT_PUBLIC_BDFARE_PASSWORD || '123456789'}`
    ).toString('base64')

    const postData = JSON.stringify({ orderReference: body.orderReference })
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
    return new Promise<NextResponse>((resolve) => {
      const req = requestModule.request(options, (res) => {
        let data = ''
        res.on('data', (chunk: Buffer | string) => {
          data += typeof chunk === 'string' ? chunk : chunk.toString()
        })
        res.on('end', () => {
          try {
            const json = JSON.parse(data) as Record<string, unknown>
            resolve(NextResponse.json(json))
          } catch {
            resolve(NextResponse.json({ error: 'Failed to parse API response', rawData: data }, { status: 500 }))
          }
        })
      })
      req.on('error', (err: Error) => {
        resolve(NextResponse.json({ error: 'Failed to fetch from external API', details: err.message }, { status: 500 }))
      })
      req.write(postData)
      req.end()
    })
  } catch (error) {
    console.error('OrderRetrieve route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
