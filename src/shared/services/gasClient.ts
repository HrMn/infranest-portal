import { GasResponse } from '@/shared/types'

const GAS_URL = import.meta.env.VITE_GAS_URL as string

interface RequestOptions {
  action: string
  params?: Record<string, string>
  body?: Record<string, unknown>
  token: string
}

async function request<T>(options: RequestOptions): Promise<T> {
  const { action, params = {}, body, token } = options

  const url = new URL(GAS_URL)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  let init: RequestInit

  if (body) {
    // POST: embed auth in body with Content-Type: text/plain.
    // GAS Web Apps don't receive the Authorization header reliably due to CORS
    // preflight stripping. text/plain is a CORS "simple" content-type that
    // skips preflight entirely, while GAS still parses the JSON body.
    init = {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, authorization: `Bearer ${token}`, ...body }),
    }
  } else {
    // GET: pass auth as a query param to avoid non-simple CORS preflight.
    // AuthGuard.gs reads request.parameter.authorization as first fallback.
    url.searchParams.set('authorization', `Bearer ${token}`)
    init = { method: 'GET' }
  }

  const res = await fetch(url.toString(), init)

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  const json: GasResponse<T> = await res.json()

  if (!json.success) {
    const err = json as unknown as { error: { code: string; message: string } }
    throw new Error(err.error?.message ?? 'Unknown GAS error')
  }

  return json.data
}

export const gasClient = {
  get<T>(action: string, params: Record<string, string>, token: string): Promise<T> {
    return request<T>({ action, params, token })
  },
  post<T>(action: string, body: Record<string, unknown>, token: string): Promise<T> {
    return request<T>({ action, body, token })
  },
}
