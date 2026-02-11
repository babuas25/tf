// Main flight search API methods
import type {
  AirShoppingRequest,
  AirShoppingResponse,
} from '@/types/flight/api/air-shopping.types'

import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'

export async function searchFlights(
  request: AirShoppingRequest
): Promise<AirShoppingResponse> {
  // Use Next.js API route as proxy to avoid CORS issues
  return apiClient<AirShoppingResponse>('/api/flight/search', {
    method: 'POST',
    body: JSON.stringify(request),
    skipAuth: true, // Auth is handled by the proxy
  })
}

export async function getMoreOffers(
  traceId: string,
  airline: string
): Promise<AirShoppingResponse> {
  return apiClient<AirShoppingResponse>(API_ENDPOINTS.GET_MORE_OFFERS, {
    method: 'POST',
    body: JSON.stringify({ traceId, airline }),
  })
}
