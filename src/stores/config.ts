import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_PREFIX = 'pb_config_'

export const useConfigStore = defineStore('config', () => {
  const imgHost = ref(localStorage.getItem('pb_imgHost') || 'github')
  const configs = ref<Record<string, Record<string, string>>>({})

  const envMappings: [string, Record<string, string>][] = [
    ['github', { repo: 'VITE_GITHUB_REPO', branch: 'VITE_GITHUB_BRANCH', accessToken: 'VITE_GITHUB_TOKEN', useCDN: 'VITE_GITHUB_USE_CDN' }],
    ['gitee', { repo: 'VITE_GITEE_REPO', branch: 'VITE_GITEE_BRANCH', accessToken: 'VITE_GITEE_TOKEN' }],
    ['aliOSS', { region: 'VITE_ALIOSS_REGION', bucket: 'VITE_ALIOSS_BUCKET', accessKeyId: 'VITE_ALIOSS_ACCESS_KEY_ID', accessKeySecret: 'VITE_ALIOSS_ACCESS_KEY_SECRET', path: 'VITE_ALIOSS_PATH', cdnHost: 'VITE_ALIOSS_CDN_HOST', useSSL: 'VITE_ALIOSS_USE_SSL' }],
    ['txCOS', { region: 'VITE_TXCOS_REGION', bucket: 'VITE_TXCOS_BUCKET', secretId: 'VITE_TXCOS_SECRET_ID', secretKey: 'VITE_TXCOS_SECRET_KEY', path: 'VITE_TXCOS_PATH', cdnHost: 'VITE_TXCOS_CDN_HOST' }],
    ['qiniu', { accessKey: 'VITE_QINIU_ACCESS_KEY', secretKey: 'VITE_QINIU_SECRET_KEY', bucket: 'VITE_QINIU_BUCKET', region: 'VITE_QINIU_REGION', path: 'VITE_QINIU_PATH', domain: 'VITE_QINIU_DOMAIN' }],
    ['minio', { endpoint: 'VITE_MINIO_ENDPOINT', port: 'VITE_MINIO_PORT', useSSL: 'VITE_MINIO_USE_SSL', bucket: 'VITE_MINIO_BUCKET', accessKey: 'VITE_MINIO_ACCESS_KEY', secretKey: 'VITE_MINIO_SECRET_KEY' }],
    ['s3', { endpoint: 'VITE_S3_ENDPOINT', region: 'VITE_S3_REGION', bucket: 'VITE_S3_BUCKET', accessKeyId: 'VITE_S3_ACCESS_KEY_ID', accessKeySecret: 'VITE_S3_ACCESS_KEY_SECRET', path: 'VITE_S3_PATH', cdnHost: 'VITE_S3_CDN_HOST', pathStyle: 'VITE_S3_PATH_STYLE' }],
    ['r2', { accountId: 'VITE_R2_ACCOUNT_ID', accessKey: 'VITE_R2_ACCESS_KEY', secretKey: 'VITE_R2_SECRET_KEY', bucket: 'VITE_R2_BUCKET', path: 'VITE_R2_PATH', domain: 'VITE_R2_DOMAIN' }],
    ['upyun', { bucket: 'VITE_UPYUN_BUCKET', operator: 'VITE_UPYUN_OPERATOR', password: 'VITE_UPYUN_PASSWORD', path: 'VITE_UPYUN_PATH', domain: 'VITE_UPYUN_DOMAIN' }],
    ['telegram', { token: 'VITE_TELEGRAM_TOKEN', chatId: 'VITE_TELEGRAM_CHAT_ID' }],
    ['mp', { appID: 'VITE_MP_APP_ID', appsecret: 'VITE_MP_APP_SECRET', proxyOrigin: 'VITE_MP_PROXY_ORIGIN' }],
    ['cloudinary', { cloudName: 'VITE_CLOUDINARY_CLOUD_NAME', apiKey: 'VITE_CLOUDINARY_API_KEY', apiSecret: 'VITE_CLOUDINARY_API_SECRET', uploadPreset: 'VITE_CLOUDINARY_UPLOAD_PRESET', folder: 'VITE_CLOUDINARY_FOLDER', domain: 'VITE_CLOUDINARY_DOMAIN' }],
  ]

  function loadFromEnv() {
    for (const [backendId, mapping] of envMappings) {
      if (configs.value[backendId]) continue // localStorage takes priority
      const cfg: Record<string, string> = {}
      for (const [field, envKey] of Object.entries(mapping)) {
        const val = (import.meta as any).env[envKey]
        if (val) cfg[field] = val
      }
      if (Object.keys(cfg).length > 0) {
        configs.value[backendId] = cfg
      }
    }
  }

  function loadAll() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        const id = key.slice(STORAGE_PREFIX.length)
        try {
          configs.value[id] = JSON.parse(localStorage.getItem(key)!)
        } catch { /* skip */ }
      }
    }
    loadFromEnv()
    const saved = localStorage.getItem('pb_imgHost') || (import.meta as any).env.VITE_DEFAULT_BACKEND
    if (saved) imgHost.value = saved
  }

  function get(backendId: string): Record<string, string> {
    return configs.value[backendId] || {}
  }

  function set(backendId: string, config: Record<string, string>) {
    configs.value[backendId] = { ...config }
    localStorage.setItem(STORAGE_PREFIX + backendId, JSON.stringify(config))
  }

  function remove(backendId: string) {
    delete configs.value[backendId]
    localStorage.removeItem(STORAGE_PREFIX + backendId)
  }

  function setImgHost(val: string) {
    imgHost.value = val
    localStorage.setItem('pb_imgHost', val)
  }

  function isConfigured(backendId: string): boolean {
    const cfg = get(backendId)
    return Object.keys(cfg).length > 0
  }

  return { imgHost, configs, loadAll, get, set, remove, setImgHost, isConfigured }
})
