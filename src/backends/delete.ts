import { ghDelete } from './github'
import { giteeDelete } from './gitee'
import { qiniuDelete } from './qiniu'
import { upyunDelete } from './upyun'
import { cloudinaryDelete } from './cloudinary'
import { s3Delete } from './s3-delete'

export async function deleteFromBackend(backend: string, meta: Record<string, string>): Promise<void> {
  switch (backend) {
    case 'github': return ghDelete(meta)
    case 'gitee': return giteeDelete(meta)
    case 'qiniu': return qiniuDelete(meta)
    case 'upyun': return upyunDelete(meta)
    case 'cloudinary': return cloudinaryDelete(meta)
    case 'aliOSS':
    case 'txCOS':
    case 'minio':
    case 's3':
    case 'r2':
      return s3Delete(meta)
    default:
      throw new Error(`${backend} 不支持图床删除`)
  }
}

export function canDeleteFromBackend(backend: string): boolean {
  return ['github', 'gitee', 'qiniu', 'upyun', 'cloudinary', 'aliOSS', 'txCOS', 'minio', 's3', 'r2'].includes(backend)
}
