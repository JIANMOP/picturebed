import { ghDelete } from './github'
import { giteeDelete } from './gitee'
import { qiniuDelete } from './qiniu'
import { upyunDelete } from './upyun'
import { cloudinaryDelete } from './cloudinary'
import { s3Delete } from './s3-delete'
import { useConfigStore } from '../stores/config'

function getToken(backend: string): string {
  const cfg = useConfigStore().get(backend)
  if (cfg.accessToken) return cfg.accessToken
  if (cfg.token) return cfg.token
  // Fallback to localStorage
  const raw = localStorage.getItem('pb_config_' + backend) || '{}'
  return JSON.parse(raw).accessToken || JSON.parse(raw).token || ''
}

export async function deleteFromBackend(backend: string, meta: Record<string, string>): Promise<void> {
  switch (backend) {
    case 'github': return ghDelete(meta, getToken('github'))
    case 'gitee': return giteeDelete(meta, getToken('gitee'))
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
