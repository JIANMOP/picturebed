import type { UploadResult } from './types'
import { apiFetch, fileToBase64 } from './helpers'
import { getDir, getDateFilename } from '../utils/format'
export async function ghUpload(
  file: File,
  config: Record<string, string>,
  _onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const repoUrl = config.repo
    .replace('https://github.com/', '')
    .replace('http://github.com/', '')
    .replace('github.com/', '')
    .split('/')
  const username = repoUrl[0]
  const repo = repoUrl[1]
  const branch = config.branch || 'master'
  const accessToken = config.accessToken
  const useCDN = config.useCDN === 'true'

  const dir = getDir()
  const dateFilename = getDateFilename(file.name)
  const content = await fileToBase64(file)

  const url = `https://api.github.com/repos/${username}/${repo}/contents/${dir}/${dateFilename}`
  const fullPath = `${dir}/${dateFilename}`
  const res = await apiFetch<{ content: { download_url: string; sha: string } }>(url, {
    method: 'PUT',
    headers: { Authorization: `token ${accessToken}` },
    body: { content, branch, message: 'Upload by Picturebed' },
  })

  const githubUrl = `raw.githubusercontent.com/${username}/${repo}/${branch}/`
  const cdnUrl = `fastly.jsdelivr.net/gh/${username}/${repo}@${branch}/`

  return {
    url: useCDN ? res.content.download_url.replace(githubUrl, cdnUrl) : res.content.download_url,
    filename: file.name,
    size: file.size,
    backend: 'github',
    meta: { sha: res.content.sha, owner: username, repo, branch, path: fullPath },
  }
}

export async function ghDelete(meta: Record<string, string>): Promise<void> {
  const { owner, repo, path, sha } = meta
  const cfg = JSON.parse(localStorage.getItem('pb_config_github') || '{}')
  const token = cfg.accessToken
  if (!token) throw new Error('GitHub config not found')

  await apiFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'DELETE',
    headers: { Authorization: `token ${token}` },
    body: { sha, message: 'Delete by Picturebed' },
  })
}
