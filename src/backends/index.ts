import type { UploadResult } from './types'
import { useConfigStore } from '../stores/config'

// Backend implementations
import { ghUpload } from './github'
import { giteeUpload } from './gitee'
import { aliOSSUpload } from './alioss'
import { txCOSUpload } from './txcos'
import { qiniuUpload } from './qiniu'
import { minioUpload } from './minio'
import { s3Upload } from './s3'
import { r2Upload } from './r2'
import { upyunUpload } from './upyun'
import { telegramUpload } from './telegram'
import { mpUpload } from './mp'
import { cloudinaryUpload } from './cloudinary'
import { formCustomUpload } from './custom'

export async function upload(
  file: File,
  backend: string,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const configStore = useConfigStore()
  const config = configStore.get(backend)

  const result = await dispatch(file, backend, config, onProgress)

  // Save result to history
  const { useHistoryStore } = await import('../stores/history')
  const historyStore = useHistoryStore()
  await historyStore.addFromResult(result, file)

  return result
}

async function dispatch(
  file: File,
  backend: string,
  config: Record<string, string>,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const fn = getUploadFn(backend)
  return fn(file, config, onProgress)
}

function getUploadFn(
  backend: string,
): (file: File, config: Record<string, string>, onProgress?: (pct: number) => void) => Promise<UploadResult> {
  switch (backend) {
    case 'github': return ghUpload
    case 'gitee': return giteeUpload
    case 'aliOSS': return aliOSSUpload
    case 'txCOS': return txCOSUpload
    case 'qiniu': return qiniuUpload
    case 'minio': return minioUpload
    case 's3': return s3Upload
    case 'r2': return r2Upload
    case 'upyun': return upyunUpload
    case 'telegram': return telegramUpload
    case 'mp': return mpUpload
    case 'cloudinary': return cloudinaryUpload
    case 'formCustom': return formCustomUpload
    default: return ghUpload
  }
}
