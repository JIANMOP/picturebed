import type { UploadResult } from './types'
import { getDateFilename } from '../utils/format'
import CryptoJS from 'crypto-js'

export async function upyunUpload(
  file: File,
  config: Record<string, string>,
  _onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const { bucket, operator, password, path = '', domain } = config
  const key = getDateFilename(file.name)
  const filename = path ? `${path}/${key}` : key
  const uri = `/${bucket}/${filename}`
  const date = new Date().toUTCString()
  const method = 'PUT'
  const signStr = [method, uri, date].join('&')
  const passwordMd5 = CryptoJS.MD5(password).toString()
  const signature = CryptoJS.HmacSHA1(signStr, passwordMd5).toString(CryptoJS.enc.Base64)
  const authorization = `UPYUN ${operator}:${signature}`

  const res = await fetch(`https://v0.api.upyun.com${uri}`, {
    method: 'PUT',
    headers: {
      Authorization: authorization,
      'X-Date': date,
      'Content-Type': file.type,
    },
    body: await file.arrayBuffer(),
  })

  if (!res.ok) throw new Error(`又拍云上传失败: ${await res.text()}`)

  return {
    url: `${domain.replace(/\/$/, '')}/${filename}`,
    filename: file.name,
    size: file.size,
    backend: 'upyun',
    meta: { uri, bucket, operator, password, filename },
  }
}

export async function upyunDelete(meta: Record<string, string>): Promise<void> {
  const { uri, bucket, operator, password } = meta
  const date = new Date().toUTCString()
  const signStr = ['DELETE', uri, date].join('&')
  const passwordMd5 = CryptoJS.MD5(password).toString()
  const signature = CryptoJS.HmacSHA1(signStr, passwordMd5).toString(CryptoJS.enc.Base64)

  const res = await fetch(`https://v0.api.upyun.com${uri}`, {
    method: 'DELETE',
    headers: { Authorization: `UPYUN ${operator}:${signature}`, 'X-Date': date },
  })
  if (!res.ok) throw new Error(`又拍云删除失败: ${await res.text()}`)
}
