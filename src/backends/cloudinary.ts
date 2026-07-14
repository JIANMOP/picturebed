import type { UploadResult } from './types'
import { apiFetch } from './helpers'
import CryptoJS from 'crypto-js'

export async function cloudinaryUpload(
  file: File,
  config: Record<string, string>,
  _onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const { cloudName, apiKey, apiSecret = '', uploadPreset = '', folder = '', domain = '' } = config

  if (!cloudName || !apiKey) throw new Error('Cloudinary 配置缺少 cloudName / apiKey')

  const timestamp = Math.floor(Date.now() / 1000)
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', apiKey)
  formData.append('timestamp', `${timestamp}`)

  if (apiSecret) {
    const params: string[] = []
    if (folder) params.push(`folder=${folder}`)
    if (uploadPreset) params.push(`upload_preset=${uploadPreset}`)
    params.push(`timestamp=${timestamp}`)
    const signature = CryptoJS.SHA1(params.sort().join('&') + apiSecret).toString()
    formData.append('signature', signature)
  } else if (uploadPreset) {
    formData.append('upload_preset', uploadPreset)
  } else {
    throw new Error('未配置 apiSecret 时必须提供 uploadPreset')
  }

  if (folder) formData.append('folder', folder)

  const res = await apiFetch<{ secure_url?: string; url?: string; public_id: string }>(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData },
  )

  const originUrl = res.secure_url || res.url
  if (!originUrl) throw new Error('Cloudinary 返回缺少 url')

  const result = domain
    ? (() => { const { pathname, search } = new URL(originUrl); return `${domain}${pathname}${search}` })()
    : originUrl

  return { url: result, filename: file.name, size: file.size, backend: 'cloudinary',
    meta: { public_id: res.public_id, cloudName, apiKey, apiSecret },
  }
}

export async function cloudinaryDelete(meta: Record<string, string>): Promise<void> {
  const { public_id, cloudName, apiKey, apiSecret } = meta
  if (!public_id || !cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary 配置缺失')
  const timestamp = Math.floor(Date.now() / 1000)
  const sig = CryptoJS.SHA1(`public_id=${public_id}&timestamp=${timestamp}${apiSecret}`).toString()
  const form = new FormData()
  form.append('public_id', public_id)
  form.append('api_key', apiKey)
  form.append('timestamp', `${timestamp}`)
  form.append('signature', sig)
  await apiFetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: 'POST', body: form })
}
