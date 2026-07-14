import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { UploadResult } from './types'
import { getDateFilename } from '../utils/format'
export async function aliOSSUpload(
  file: File,
  config: Record<string, string>,
  _onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const { region, bucket, accessKeyId, accessKeySecret, path = '', cdnHost = '', useSSL } = config
  const secure = useSSL !== 'false'
  const protocol = secure ? 'https' : 'http'
  const endpoint = `${protocol}://${region}.aliyuncs.com`

  const s3Client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey: accessKeySecret },
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
    : `${protocol}://${bucket}.${region}.aliyuncs.com/${key}`

  return { url, filename: file.name, size: file.size, backend: 'aliOSS',
    meta: { key, bucket, region, endpoint, accessKeyId, accessKeySecret, pathStyle: 'false' },
  }
}
