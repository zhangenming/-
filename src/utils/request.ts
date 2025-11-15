export function apiFetch(input: string, init?: any) {
  const headers = new Headers(init?.headers as any)
  const token = (window as any).token || (localStorage as any).token
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
  let url = input
  if (!/^https?:\/\//.test(url)) {
    if (url.startsWith('/api/')) url = '/vite' + url
    else if (url.startsWith('api/')) url = 'vite/' + url
  }
  let method = 'GET'
  if (init && typeof init === 'object' && typeof init.method === 'string') method = String(init.method).toUpperCase()
  const known: Record<string, true> = {
    method: true,
    headers: true,
    body: true,
    params: true,
    signal: true,
    mode: true,
    cache: true,
    credentials: true,
    redirect: true,
    referrer: true,
    referrerPolicy: true,
    integrity: true,
    keepalive: true,
    window: true,
  }
  const buildParams = (obj: any) => {
    const sp = new URLSearchParams()
    for (const k in obj || {}) {
      if (known[k]) continue
      const v = obj[k]
      if (v === undefined || v === null) continue
      if (Array.isArray(v)) v.forEach(x => sp.append(k, String(x)))
      else sp.append(k, String(v))
    }
    return sp
  }
  const fetchInit: RequestInit = { headers }
  if (method === 'GET') {
    const source = init && typeof init === 'object' ? (init.params ?? init) : undefined
    const sp = source ? buildParams(source) : undefined
    if (sp && String(sp)) {
      const qs = sp.toString()
      if (qs) url += (url.includes('?') ? '&' : '?') + qs
    }
    fetchInit.method = 'GET'
  } else {
    let body: any = undefined
    if (init && typeof init === 'object' && 'body' in init) body = init.body
    else if (init && typeof FormData !== 'undefined' && init instanceof FormData) body = init
    else if (init && typeof init === 'object') {
      const payload: any = {}
      for (const k in init) {
        if (known[k]) continue
        payload[k] = init[k]
      }
      body = payload
    }
    if (body && typeof FormData !== 'undefined' && body instanceof FormData) {
      headers.delete('Content-Type')
      fetchInit.body = body as any
    } else if (body !== undefined) {
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
      fetchInit.body = typeof body === 'string' ? (body as any) : JSON.stringify(body)
    }
    fetchInit.method = method
  }
  return fetch(url, fetchInit)
}
export async function apiJson(input: string, init?: any) {
  const res = await apiFetch(input, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (data as any)?.message || (data as any)?.messgae || `请求失败(${res.status})`
    throw new Error(msg)
  }
  return data
}