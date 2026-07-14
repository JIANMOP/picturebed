import * as qiniu from 'qiniu-js'
import type { UploadResult } from './types'
import { getDateFilename } from '../utils/format'
import { base64encode, safe64, utf16to8, apiFetch } from './helpers'
import CryptoJS from 'crypto-js'

function getQiniuToken(accessKey: string, secretKey: string, putPolicy: { scope: string; deadline: number }) {
  const policy = JSON.stringify(putPolicy)
  const encoded = base64encode(utf16to8(policy))
  const hash = CryptoJS.HmacSHA1(encoded, secretKey)
  const encodedSigned = hash.toString(CryptoJS.enc.Base64)
  return `${accessKey}:${safe64(encodedSigned)}:${encoded}`
}

export async function qiniuUpload(
  file: File,
  config: Record<string, string>,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const { accessKey, secretKey, bucket, region, path = '', domain } = config
  const token = getQiniuToken(accessKey, secretKey, {
    scope: bucket,
    deadline: Math.trunc(Date.now() / 1000) + 3600,
  })
  const dir = path ? `${path}/` : ''
  const key = dir + getDateFilename(file.name)
  const observable = qiniu.upload(file, key, token, {}, { region })

  return new Promise<UploadResult>((resolve, reject) => {
    observable.subscribe({
      next: (result: any) => {
        if (onProgress && result.total?.percent !== undefined) {
          onProgress(result.total.percent)
        }
      },
      error: (err: any) => reject(new Error(err.message || '七牛上传失败')),
      complete: (result: any) => {
        resolve({
          url: `${domain.replace(/\/$/, '')}/${result.key}`,
          filename: file.name,
          size: file.size,
          backend: 'qiniu',
          meta: { key: result.key, bucket, accessKey, secretKey },
        })
      },
    })
  })
}

export async function qiniuDelete(meta: Record<string, string>): Promise<void> {
  const { key, bucket, accessKey, secretKey } = meta
  if (!accessKey || !secretKey) throw new Error('七牛配置缺失')
  const token = getQiniuToken(accessKey, secretKey, {
    scope: bucket,
    deadline: Math.trunc(Date.now() / 1000) + 3600,
  })
  const encodedKey = safe64(base64encode(utf16to8(`${bucket}:${key}`)))
  const url = `https://rs.qiniu.com/delete/${encodedKey}`
  await apiFetch(url, { method: 'POST', headers: { Authorization: `QBox ${token}` } })
}
