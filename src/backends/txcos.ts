import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { UploadResult } from './types'
import { getDateFilename } from '../utils/format'
export async function txCOSUpload(
  file: File,
  config: Record<string, string>,
  _onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const { region, bucket, secretId, secretKey, path = '', cdnHost = '' } = config
  const endpoint = `https://cos.${region}.myqcloud.com`

  const s3Client = new S3Client({
    region,
    credentials: { accessKeyId: secretId, secretAccessKey: secretKey },
    endpoint,
    forcePathStyle: false,
  })

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

  const url = cdnHost
    ? `${cdnHost.replace(/\/$/, '')}/${key}`
    : `https://${bucket}.cos.${region}.myqcloud.com/${key}`

  return { url, filename: file.name, size: file.size, backend: 'txCOS',
    meta: { key, bucket, region, endpoint, accessKeyId: secretId, accessKeySecret: secretKey, pathStyle: 'false' },
  }
}
