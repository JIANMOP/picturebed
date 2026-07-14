import type { UploadResult } from './types'
import { apiFetch } from './helpers'
import { useConfigStore } from '../stores/config'

async function getMpToken(appID: string, appsecret: string, proxyOrigin: string): Promise<string> {
  const cacheKey = `mp_token_${appID}`
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    const token = JSON.parse(cached)
    if (token.expire && token.expire > Date.now()) {
      return token.access_token
    }
  }

  const body: any = { grant_type: 'client_credential', appid: appID, secret: appsecret }
  let url = 'https://api.weixin.qq.com/cgi-bin/stable_token'
  if (proxyOrigin) {
    url = `${proxyOrigin}/cgi-bin/stable_token`
  }

  const res = await apiFetch<{ access_token: string; expires_in: number; errcode?: number }>(url, {
    method: 'POST',
    body,
  })

  if (res.access_token) {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ ...res, expire: Date.now() + res.expires_in * 1000 }),
    )
    return res.access_token
  }
  return ''
}

export async function mpUpload(
  file: File,
  config: Record<string, string>,
  _onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const { appID, appsecret, proxyOrigin = '' } = config
  const accessToken = await getMpToken(appID, appsecret, proxyOrigin)
  if (!accessToken) throw new Error('获取微信公众号 access_token 失败')

  const formdata = new FormData()
  formdata.append('media', file, file.name)

  const fileSizeInMB = file.size / (1024 * 1024)
  const fileType = file.type.toLowerCase()
  let url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`

  if (fileSizeInMB < 1 && (fileType === 'image/jpeg' || fileType === 'image/png')) {
    url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`
  }
  if (proxyOrigin) {
    url = url.replace('https://api.weixin.qq.com', proxyOrigin)
  }

  const res = await apiFetch<{ url: string }>(url, { method: 'POST', body: formdata })
  if (!res.url) throw new Error('上传失败，未获取到 URL')

  let imageUrl = res.url
  if (proxyOrigin && window.location.href.startsWith('http')) {
    imageUrl = `https://wsrv.nl?url=${encodeURIComponent(imageUrl)}`
  }

  return { url: imageUrl, filename: file.name, size: file.size, backend: 'mp' }
}
