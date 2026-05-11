import 'dotenv/config'

let cachedToken: string | null = null
let tokenExpires = 0

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080'
const AUTH_EMAIL = process.env.API_AUTH_EMAIL || ''
const AUTH_PASSWORD = process.env.API_AUTH_PASSWORD || ''

const login = async (): Promise<string> => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD })
  })
  if (!res.ok) throw new Error(`Auth login failed: ${res.status}`)
  const data = await res.json()
  cachedToken = data.token
  tokenExpires = Date.now() + 3600_000
  return cachedToken!
}

export const getToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < tokenExpires) return cachedToken
  return login()
}

export const apiCall = async (path: string, options: RequestInit = {}): Promise<any> => {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  })
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new Error(`API error ${res.status}: ${JSON.stringify(data)}`)
  return data
}
