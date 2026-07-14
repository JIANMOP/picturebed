import type { UploadResult } from './types'
import { apiFetch } from './helpers'

export async function telegramUpload(
  file: File,
  config: Record<string, string>,
  _onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const { token, chatId } = config

  const form = new FormData()
  form.append('chat_id', chatId)
  form.append('photo', file, file.name)

  const sendRes = await apiFetch<{ ok: boolean; result: { photo: { file_id: string }[] } }>(
    `https://api.telegram.org/bot${token}/sendPhoto`,
    { method: 'POST', body: form },
  )

  if (!sendRes.ok || !sendRes.result.photo.length) {
    throw new Error('Telegram sendPhoto 失败')
  }

  const fileId = sendRes.result.photo[sendRes.result.photo.length - 1].file_id

  const fileRes = await apiFetch<{ ok: boolean; result: { file_path: string } }>(
    `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`,
  )

  if (!fileRes.ok) throw new Error('Telegram getFile 失败')

  return {
    url: `https://api.telegram.org/file/bot${token}/${fileRes.result.file_path}`,
    filename: file.name,
    size: file.size,
    backend: 'telegram',
  }
}
