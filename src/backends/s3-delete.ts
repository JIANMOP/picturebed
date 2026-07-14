import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'

export interface S3Meta {
  key: string
  bucket: string
  region: string
  endpoint?: string
  accessKeyId: string
  accessKeySecret: string
  pathStyle?: string
}

export async function s3Delete(meta: Record<string, string>): Promise<void> {
  const { key, bucket, region, endpoint, accessKeyId, accessKeySecret, pathStyle } = meta
  const cfg: any = {
    region: region || 'auto',
    credentials: { accessKeyId, secretAccessKey: accessKeySecret },
    forcePathStyle: pathStyle === 'true',
  }
  if (endpoint) cfg.endpoint = endpoint

  const client = new S3Client(cfg)
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}
