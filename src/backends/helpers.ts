import { toBase64 } from '../utils/format'

// Ported from @md/shared/utils/tokenTools — no external deps needed
export function utf16to8(str: string): string {
  let out = ''
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    if (c >= 0x0001 && c <= 0x007F) {
      out += str.charAt(i)
    } else if (c > 0x07FF) {
      out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F))
      out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F))
      out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F))
    } else {
      out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F))
      out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F))
    }
  }
  return out
}

export function base64encode(str: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(str)
  }
  // fallback for environments without btoa (unlikely in browsers)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let out = ''
  const bytes = new TextEncoder().encode(str)
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i]
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0
    out += chars[b1 >> 2]
    out += chars[((b1 & 3) << 4) | (b2 >> 4)]
    out += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '='
    out += i + 2 < bytes.length ? chars[b3 & 63] : '='
  }
  return out
}

export function safe64(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_')
}

// Simple fetch wrapper — replaces @md/shared/utils/fetch
export async function apiFetch<T = any>(url: string, options: {
  method?: string
  headers?: Record<string, string>
  body?: any
} = {}): Promise<T> {
  const { method = 'GET', headers = {}, body } = options
  const fetchOpts: RequestInit = { method, headers }

  if (body) {
    if (body instanceof FormData) {
      fetchOpts.body = body
    } else if (typeof body === 'object') {
      fetchOpts.body = JSON.stringify(body)
      fetchOpts.headers = { ...fetchOpts.headers as Record<string, string>, 'Content-Type': 'application/json' }
    } else {
      fetchOpts.body = body
    }
  }

  const res = await fetch(url, fetchOpts)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }
  return res.text() as any
}

export { toBase64 as fileToBase64 }
