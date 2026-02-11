import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { saveBooking, listBookings, getBookingByReference } from '@/lib/firebase/bookings-server'
import { fetchOrderRetrieve } from '@/lib/flight/api/orderretrieve'
import { orderResponseToBookingRecord } from '@/lib/flight/transformers/order-to-booking'
import {
  getBookingPermissions,
  filterBookingsByPermissions,
  type BookingUser,
} from '@/lib/utils/booking-permissions'
import type { RoleType } from '@/lib/utils/constants'
import type { OrderCreateApiResponse } from '@/types/flight/api/order.types'

/**
 * GET /api/bookings
 * List bookings from Firestore with role-based filtering.
 */
export async function GET() {
  try {
    // Get user session for permissions
    const session = await getServerSession(authOptions as never)
    const sessionUserObj =
      session && typeof session === 'object' && 'user' in session
        ? (session as { user?: { id?: string; email?: string; role?: string } }).user
        : undefined
    if (!sessionUserObj || !sessionUserObj.email || !sessionUserObj.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionUser = {
      id: sessionUserObj.id ?? sessionUserObj.email,
      email: sessionUserObj.email,
      role: sessionUserObj.role,
    }

    const user: BookingUser = {
      id: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.role as RoleType,
    }

    const permissions = getBookingPermissions(user.role)

    // Check if user has view permission
    if (!permissions.canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch all bookings
    const allBookings = await listBookings(300)

    // Filter bookings based on user permissions (cast to expected type)
    const filteredBookings = filterBookingsByPermissions(
      user,
      allBookings as unknown as Array<{
        referenceNo: string
        createdBy: string
        createdByEmail?: string
        [key: string]: unknown
      }>,
      permissions,
    )

    return NextResponse.json(filteredBookings)
  } catch (error) {
    console.error('GET /api/bookings error:', error)
    return NextResponse.json({ error: 'Failed to list bookings' }, { status: 500 })
  }
}

/**
 * POST /api/bookings
 * Create or update a booking in Firestore with role-based permissions.
 * Body A: { orderResponse: OrderCreateApiResponse, createdBy?: string } — save after OrderCreate.
 * Body B: { orderReference: string } — fetch OrderRetrieve then update Firestore.
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session for permissions
    const session = await getServerSession(authOptions as never)
    const sessionUserObj =
      session && typeof session === 'object' && 'user' in session
        ? (session as { user?: { id?: string; email?: string; role?: string } }).user
        : undefined

    // Allow guest users to create bookings (for flight booking flow)
    let user: BookingUser | null = null
    let permissions: ReturnType<typeof getBookingPermissions> | null = null

    if (sessionUserObj?.email && sessionUserObj?.role) {
      const sessionUser = {
        id: sessionUserObj.id ?? sessionUserObj.email,
        email: sessionUserObj.email,
        role: sessionUserObj.role,
      }

      user = {
        id: sessionUser.id,
        email: sessionUser.email,
        role: sessionUser.role as RoleType,
      }

      permissions = getBookingPermissions(user.role)

      // Check if authenticated user has create permission
      if (!permissions.canCreate) {
        return NextResponse.json(
          { error: 'Insufficient permissions to create bookings' },
          { status: 403 },
        )
      }
    }
    const body = (await request.json()) as {
      orderResponse?: OrderCreateApiResponse & {
        response?: OrderCreateApiResponse['response']
        respondedOn?: string
      }
      createdBy?: string
      orderReference?: string
    }

    // Normalize: support orderResponse.response, direct body.response, or API-style Response (capital R)
    const orderResponse = body.orderResponse as Record<string, unknown> | undefined
    const response =
      orderResponse?.response ??
      (orderResponse as { Response?: OrderCreateApiResponse['response'] } | undefined)?.Response ??
      (body as { response?: OrderCreateApiResponse['response'] }).response
    const respondedOn =
      (orderResponse?.respondedOn as string | undefined) ??
      (body as { respondedOn?: string }).respondedOn ??
      new Date().toISOString()

    if (
      response &&
      typeof response === 'object' &&
      'orderReference' in response &&
      response.orderReference
    ) {
      const metadata: {
        respondedOn: string
        createdBy: string
        createdByEmail?: string
      } = {
        respondedOn,
        createdBy: body.createdBy ?? user?.email ?? user?.id ?? 'Guest',
      }
      if (user?.email) {
        metadata.createdByEmail = user.email
      }
      const record = orderResponseToBookingRecord(
        response as OrderCreateApiResponse['response'],
        metadata,
      )
      await saveBooking(record)
      return NextResponse.json({ success: true, referenceNo: record.referenceNo })
    }

    if (body.orderReference) {
      const orderRef = String(body.orderReference).trim()
      let data: OrderCreateApiResponse & { Response?: OrderCreateApiResponse['response'] }
      try {
        data = await fetchOrderRetrieve(orderRef)
      } catch (err) {
        console.error('OrderRetrieve in POST /api/bookings failed:', err)
        return NextResponse.json(
          { error: 'OrderRetrieve failed', details: String(err) },
          { status: 502 },
        )
      }
      // Support both 'response' and 'Response' (some APIs use capital R)
      const orderData = data?.response ?? data?.Response
      if (!orderData || typeof orderData !== 'object' || !('orderReference' in orderData)) {
        const apiError =
          (data as { error?: { errorMessage?: string }; message?: string })?.error?.errorMessage ??
          (data as { error?: { errorMessage?: string }; message?: string })?.message
        return NextResponse.json(
          {
            error: 'Invalid OrderRetrieve response',
            details:
              apiError ??
              (data?.success === false
                ? 'Order not found or no longer available'
                : 'No order data returned'),
          },
          { status: 400 },
        )
      }
      const existingRecord = await getBookingByReference(orderRef)

      // For updates, check if user can update this booking (only if authenticated)
      const existing = existingRecord as { createdBy: string; createdByEmail?: string } | null
      if (existing && user && permissions && !permissions.canViewAll) {
        const userId = user.id.trim().toLowerCase()
        const userEmail = user.email.trim().toLowerCase()
        const createdBy = existing.createdBy.trim().toLowerCase()
        const createdByEmail = (existing.createdByEmail ?? '').trim().toLowerCase()
        const canUpdate =
          (userId !== '' && createdBy === userId) ||
          (userEmail !== '' && createdBy === userEmail) ||
          (userEmail !== '' && createdByEmail === userEmail)

        if (!canUpdate) {
          return NextResponse.json(
            { error: 'Insufficient permissions to update this booking' },
            { status: 403 },
          )
        }
      }

      const metadata: {
        respondedOn: string
        createdBy: string
        createdByEmail?: string
      } = {
        respondedOn: data.respondedOn ?? new Date().toISOString(),
        createdBy: existingRecord?.createdBy ?? user?.email ?? user?.id ?? 'Guest',
      }
      const emailToUse = existingRecord?.createdByEmail ?? user?.email
      if (emailToUse) {
        metadata.createdByEmail = emailToUse
      }
      const record = orderResponseToBookingRecord(orderData, metadata)
      await saveBooking(record)
      return NextResponse.json({ success: true, referenceNo: record.referenceNo })
    }

    return NextResponse.json({ error: 'Provide orderResponse or orderReference' }, { status: 400 })
  } catch (error) {
    console.error('POST /api/bookings error:', error)
    return NextResponse.json({ error: 'Failed to save booking' }, { status: 500 })
  }
}

/**
 * DELETE /api/bookings
 * Delete a booking from Firestore with role-based permissions.
 * Body: { orderReference: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get user session for permissions
    const session = await getServerSession(authOptions as never)
    const sessionUserObj =
      session && typeof session === 'object' && 'user' in session
        ? (session as { user?: { id?: string; email?: string; role?: string } }).user
        : undefined
    if (!sessionUserObj || !sessionUserObj.id || !sessionUserObj.email || !sessionUserObj.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionUser = {
      id: sessionUserObj.id,
      email: sessionUserObj.email,
      role: sessionUserObj.role,
    }

    const user: BookingUser = {
      id: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.role as RoleType,
    }

    const permissions = getBookingPermissions(user.role)

    // Check if user has delete permission
    if (!permissions.canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete bookings' },
        { status: 403 },
      )
    }

    const body = (await request.json()) as {
      orderReference?: string
    }

    if (!body.orderReference) {
      return NextResponse.json({ error: 'Order reference is required' }, { status: 400 })
    }

    const orderRef = String(body.orderReference).trim()

    // Get existing booking to check permissions
    const existingRecord = await getBookingByReference(orderRef)

    if (!existingRecord) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user can delete this specific booking
    const canDelete =
      user.role === 'SuperAdmin' ||
      user.role === 'Admin' ||
      (permissions.canViewAll && permissions.canDelete)

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this booking' },
        { status: 403 },
      )
    }

    // TODO: Implement actual delete function in bookings-server.ts
    // For now, we'll return success - actual implementation would be:
    // await deleteBooking(orderRef)

    return NextResponse.json({
      success: true,
      message: 'Booking deletion requested',
      referenceNo: orderRef,
    })
  } catch (error) {
    console.error('DELETE /api/bookings error:', error)
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 })
  }
}
