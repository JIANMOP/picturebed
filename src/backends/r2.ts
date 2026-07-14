import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { UploadResult } from './types'
import { getDateFilename } from '../utils/format'
export async function r2Upload(
  file: File,
  config: Record<string, string>,
  _onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const { accountId, accessKey, secretKey, bucket, path = '', domain } = config
  const dir = path ? `${path}/` : ''
  const key = dir + getDateFilename(file.name)

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  })

  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: file.type })
  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 })

  await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  return {
    url: `${domain.replace(/\/$/, '')}/${key}`,
    filename: file.name,
    size: file.size,
    backend: 'r2',
    meta: { key, bucket, region: 'auto', endpoint: `https://${accountId}.r2.cloudflarestorage.com`, accessKeyId: accessKey, accessKeySecret: secretKey, pathStyle: 'false' },
  }
}
