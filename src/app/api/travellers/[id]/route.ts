import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'

import { authOptions } from '@/lib/auth/nextauth'
import { getTravellerById, updateTraveller, deleteTraveller } from '@/lib/db/travellers'
import { rateLimiters } from '@/lib/middleware/rate-limit-middleware'

// GET /api/travellers/[id] - Get traveller by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return rateLimiters.api(request, async (_req: NextRequest) => {
    try {
      const session = await getServerSession(authOptions as never)
      const userObj =
        session && typeof session === 'object' && 'user' in session
          ? (session as { user?: Record<string, unknown> }).user
          : undefined
      if (!userObj) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { id } = await params
      const role = typeof userObj.role === 'string' ? userObj.role : ''
      const userId = typeof userObj.id === 'string' ? userObj.id : ''
      const traveller = await getTravellerById(id, role, userId)

      if (!traveller) {
        return NextResponse.json({ error: 'Traveller not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        traveller,
      })
    } catch (error) {
      console.error('Error fetching traveller:', error)
      return NextResponse.json({ error: 'Failed to fetch traveller' }, { status: 500 })
    }
  })
}

// PUT /api/travellers/[id] - Update traveller
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return rateLimiters.api(request, async (_req: NextRequest) => {
    try {
      const session = await getServerSession(authOptions as never)
      const userObj =
        session && typeof session === 'object' && 'user' in session
          ? (session as { user?: Record<string, unknown> }).user
          : undefined
      if (!userObj) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const body: unknown = await request.json()

      const travellerUpdateSchema = z.object({
        ptc: z.string().optional(),
        givenName: z.string().min(1).optional(),
        surname: z.string().min(1).optional(),
        gender: z.string().optional(),
        birthdate: z.union([z.string().min(1), z.null(), z.undefined()]).optional(),
        nationality: z.string().max(3).nullable().optional(),
        phoneNumber: z.string().min(1).optional(),
        countryDialingCode: z.string().nullable().optional(),
        emailAddress: z.string().email().nullable().optional(),
        documentType: z.string().nullable().optional(),
        documentId: z.string().nullable().optional(),
        documentExpiryDate: z.union([z.string().min(1), z.null(), z.undefined()]).optional(),
        ssrCodes: z
          .array(
            z.union([z.string(), z.object({ code: z.string(), remark: z.string().optional() })]),
          )
          .optional(),
        loyaltyAirlineCode: z.string().nullable().optional(),
        loyaltyAccountNumber: z.string().nullable().optional(),
      })

      const parsed = travellerUpdateSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid payload', details: parsed.error.flatten() },
          { status: 400 },
        )
      }
      const data = parsed.data

      // Process SSR codes - convert from objects to strings and create remarks object
      type SsrItem = string | { code: string; remark?: string | undefined }
      const ssrCodes = (data.ssrCodes || []).map((ssr: SsrItem) =>
        typeof ssr === 'string' ? ssr : ssr.code,
      )
      const ssrRemarks: Record<string, string> = {}
      if (data.ssrCodes && Array.isArray(data.ssrCodes)) {
        for (const ssr of data.ssrCodes as SsrItem[]) {
          if (typeof ssr !== 'string' && ssr.code && ssr.remark) {
            ssrRemarks[ssr.code] = ssr.remark
          }
        }
      }

      // Helper function to convert empty strings to null for date fields
      const processDateField = (dateValue: unknown): string | null => {
        if (dateValue === null || dateValue === undefined) return null
        if (typeof dateValue === 'string') {
          const v = dateValue.trim()
          return v.length === 0 || v === 'undefined' ? null : v
        }
        return null
      }

      // Update traveller
      const { id } = await params
      const updates: Record<string, unknown> = {}
      if (data.ptc !== undefined) updates.ptc = data.ptc
      if (data.givenName !== undefined) updates.givenName = data.givenName
      if (data.surname !== undefined) updates.surname = data.surname
      if (data.gender !== undefined) updates.gender = data.gender
      {
        const v = processDateField(data.birthdate)
        if (v !== undefined) updates.birthdate = v
      }
      if (data.nationality !== undefined) updates.nationality = data.nationality
      if (data.phoneNumber !== undefined) updates.phoneNumber = data.phoneNumber
      if (data.countryDialingCode !== undefined)
        updates.countryDialingCode = data.countryDialingCode
      if (data.emailAddress !== undefined) updates.emailAddress = data.emailAddress
      if (data.documentType !== undefined) updates.documentType = data.documentType
      if (data.documentId !== undefined) updates.documentId = data.documentId
      {
        const v = processDateField(data.documentExpiryDate)
        if (v !== undefined) updates.documentExpiryDate = v
      }
      if (ssrCodes.length > 0) updates.ssrCodes = ssrCodes
      if (Object.keys(ssrRemarks).length > 0) updates.ssrRemarks = ssrRemarks
      if (data.loyaltyAirlineCode !== undefined)
        updates.loyaltyAirlineCode = data.loyaltyAirlineCode
      if (data.loyaltyAccountNumber !== undefined)
        updates.loyaltyAccountNumber = data.loyaltyAccountNumber

      const role = typeof userObj.role === 'string' ? userObj.role : ''
      const userId = typeof userObj.id === 'string' ? userObj.id : ''
      const traveller = await updateTraveller(id, updates, role, userId)

      if (!traveller) {
        return NextResponse.json({ error: 'Traveller not found or access denied' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        traveller,
      })
    } catch (error) {
      console.error('Error updating traveller:', error)
      return NextResponse.json({ error: 'Failed to update traveller' }, { status: 500 })
    }
  })
}

// DELETE /api/travellers/[id] - Delete traveller (SuperAdmin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return rateLimiters.api(request, async (_req: NextRequest) => {
    try {
      const session = await getServerSession(authOptions as never)
      const userObj =
        session && typeof session === 'object' && 'user' in session
          ? (session as { user?: Record<string, unknown> }).user
          : undefined
      if (!userObj) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { id } = await params
      const role = typeof userObj.role === 'string' ? userObj.role : ''
      const userId = typeof userObj.id === 'string' ? userObj.id : ''
      const traveller = await deleteTraveller(id, role, userId)

      if (!traveller) {
        return NextResponse.json({ error: 'Traveller not found or access denied' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        message: 'Traveller deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting traveller:', error)
      return NextResponse.json({ error: 'Failed to delete traveller' }, { status: 500 })
    }
  })
}
