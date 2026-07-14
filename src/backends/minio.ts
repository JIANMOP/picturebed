import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { UploadResult } from './types'
import { getDateFilename } from '../utils/format'
export async function minioUpload(
  file: File,
  config: Record<string, string>,
  _onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const { endpoint, port = '', useSSL, bucket, accessKey, secretKey } = config
  const secure = useSSL === 'true'
  const protocol = secure ? 'https' : 'http'
  const ep = `${protocol}://${endpoint}${port ? `:${port}` : ''}`

  const s3Client = new S3Client({
    endpoint: ep,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    region: 'auto',
    forcePathStyle: true,
  })

  const key = getDateFilename(file.name)
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: file.type })
  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 })

  await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  return {
    url: `${ep}/${bucket}/${key}`,
    filename: file.name,
    size: file.size,
    backend: 'minio',
    meta: { key, bucket, region: 'auto', endpoint: ep, accessKeyId: accessKey, accessKeySecret: secretKey, pathStyle: 'true' },
  }
}
