import type { UploadResult } from './types'
import { apiFetch, fileToBase64 } from './helpers'
import { getDir, getDateFilename } from '../utils/format'
export async function giteeUpload(
  file: File,
  config: Record<string, string>,
  _onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const repoUrl = config.repo
    .replace('https://gitee.com/', '')
    .replace('http://gitee.com/', '')
    .replace('gitee.com/', '')
    .split('/')
  const username = repoUrl[0]
  const repo = repoUrl[1]
  const branch = config.branch || 'master'
  const accessToken = config.accessToken

  const dir = getDir()
  const dateFilename = getDateFilename(file.name)
  const content = await fileToBase64(file)

  const fullPath = `${dir}/${dateFilename}`
  const res = await apiFetch<{ content: { download_url: string; sha: string } }>('/api/upload/gitee', {
    method: 'POST',
    body: {
      content,
      filename: fullPath,
      username,
      repo,
      branch,
      accessToken,
    },
  })

  return {
    url: encodeURI(res.content.download_url),
    filename: file.name,
    size: file.size,
    backend: 'gitee',
    meta: {
      sha: res.content.sha,
      owner: username,
      repo,
      branch,
      path: fullPath,
    },
  }
}

export async function giteeDelete(meta: Record<string, string>, accessToken: string): Promise<void> {
  const { owner, repo, path, sha, branch } = meta
  if (!accessToken) throw new Error('Gitee 配置未找到')

  await apiFetch('/api/delete/gitee', {
    method: 'POST',
    body: { owner, repo, path, sha, branch, accessToken },
  })
}
