import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { UploadResult } from './types'
import { getDateFilename } from '../utils/format'

const PROTOCOL_REGEX = /^https?:\/\//

export async function s3Upload(
  file: File,
  config: Record<string, string>,
  _onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const { endpoint = '', region, bucket, accessKeyId, accessKeySecret, path = '', cdnHost = '', pathStyle = 'false' } = config

  const clientConfig: any = {
    region,
    credentials: { accessKeyId, secretAccessKey: accessKeySecret },
    forcePathStyle: pathStyle === 'true',
  }
  if (endpoint) {
    clientConfig.endpoint = endpoint.startsWith('http') ? endpoint : `https://${endpoint}`
  }

  const s3Client = new S3Client(clientConfig)
  const dir = path ? `${path}/` : ''
  const key = dir + getDateFilename(file.name)

  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: file.type })
  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 })

  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`)

  let url: string
  if (cdnHost) {
    url = `${cdnHost.replace(/\/$/, '')}/${key}`
  } else if (endpoint) {
    const proto = clientConfig.endpoint.startsWith('https') ? 'https' : 'http'
    const host = clientConfig.endpoint.replace(PROTOCOL_REGEX, '')
    url = pathStyle === 'true'
      ? `${proto}://${host}/${bucket}/${key}`
      : `${proto}://${bucket}.${host}/${key}`
  } else {
    url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  }

  const ep = endpoint ? (endpoint.startsWith('http') ? endpoint : `https://${endpoint}`) : ''
  return { url, filename: file.name, size: file.size, backend: 's3',
    meta: { key, bucket, region, endpoint: ep, accessKeyId, accessKeySecret, pathStyle },
  }
}
