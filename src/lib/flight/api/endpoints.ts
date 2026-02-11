// API endpoint constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_BDFARE_API_URL || 'https://localhost:8443'

export const API_ENDPOINTS = {
  // Flight Search
  AIR_SHOPPING: `${API_BASE_URL}/AirShopping`,
  GET_MORE_OFFERS: `${API_BASE_URL}/getmoreoffers`,
  
  // Flight Details
  MINI_RULE: `${API_BASE_URL}/MiniRule`,
  FARE_RULES: `${API_BASE_URL}/FareRules`,
  
  // Repricing APIs
  OFFER_PRICE: `${API_BASE_URL}/OfferPrice`,
  ORDER_SELL: `${API_BASE_URL}/OrderSell`,
  ORDER_RESHOP_PRICE: `${API_BASE_URL}/OrderReshopPrice`,
  
  // Booking APIs
  ORDER_CREATE: `${API_BASE_URL}/OrderCreate`,
  ORDER_RETRIEVE: `${API_BASE_URL}/OrderRetrieve`,
  ORDER_CANCEL: `${API_BASE_URL}/OrderCancel`,
  ORDER_CHANGE: `${API_BASE_URL}/OrderChange`,
  
  // Ancillary APIs
  SEAT_AVAILABILITY: `${API_BASE_URL}/SeatAvailability`,
  SERVICE_LIST: `${API_BASE_URL}/ServiceList`,
  
  // Account
  GET_BALANCE: `${API_BASE_URL}/GetBalance`,
} as const

export const AUTH_CONFIG = {
  username: process.env.NEXT_PUBLIC_BDFARE_USERNAME || 'superadmin',
  password: process.env.NEXT_PUBLIC_BDFARE_PASSWORD || '123456789',
}

export const POINT_OF_SALE = 'BD'
