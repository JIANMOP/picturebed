import type { UploadResult } from './types'
import { apiFetch, base64encode, utf16to8, safe64, fileToBase64 } from './helpers'
import { getDir, getDateFilename } from '../utils/format'
import CryptoJS from 'crypto-js'
import { v4 as uuidv4 } from 'uuid'
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import * as qiniu from 'qiniu-js'

export async function formCustomUpload(
  file: File,
  config: Record<string, string>,
  _onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const customConfig = config.code || config.customCode || ''
  if (!customConfig) throw new Error('自定义上传代码为空')

  const content = await fileToBase64(file)
  const fnBody = `async (CUSTOM_ARG) => { ${customConfig} }`

  return new Promise<UploadResult>((resolve, reject) => {
    const exportObj = {
      content,
      file,
      util: {
        axios: apiFetch,
        CryptoJS,
        Buffer: {
          from: (str: string) => {
            const encoder = new TextEncoder()
            return encoder.encode(str)
          },
        },
        uuidv4,
        qiniu,
        tokenTools: { base64encode, utf16to8, safe64 },
        getDir,
        getDateFilename: (fname: string) => getDateFilename(fname),
        S3: { S3Client, PutObjectCommand, getSignedUrl },
      },
      okCb: (url: string) => resolve({ url, filename: file.name, size: file.size, backend: 'formCustom' }),
      errCb: (err: any) => reject(new Error(err?.message || String(err))),
    }

    const fn = new Function(`return (${fnBody})`)()
    fn(exportObj).catch((err: any) => {
      console.error(err)
      reject(err)
    })
  })
}
