import type { BackendDef } from './types'

export const BACKENDS: BackendDef[] = [
  {
    id: 'github',
    label: 'GitHub',
    description: '上传到 GitHub 仓库，支持 jsDelivr CDN 加速',
    fields: [
      { key: 'repo', label: '仓库地址', type: 'text', required: true, placeholder: 'https://github.com/user/repo' },
      { key: 'branch', label: '分支', type: 'text', required: true, placeholder: 'master' },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'useCDN', label: '使用 CDN', type: 'select', required: false, options: [{ label: '否', value: 'false' }, { label: '是 (jsDelivr)', value: 'true' }] },
    ],
  },
  {
    id: 'gitee',
    label: 'Gitee',
    description: '上传到 Gitee 仓库，通过后端代理绕过防盗链',
    fields: [
      { key: 'repo', label: '仓库地址', type: 'text', required: true, placeholder: 'https://gitee.com/user/repo' },
      { key: 'branch', label: '分支', type: 'text', required: true, placeholder: 'master' },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
    proxy: 'gitee',
  },
  {
    id: 'aliOSS',
    label: '阿里云 OSS',
    description: '通过 S3 兼容协议上传到阿里云对象存储',
    fields: [
      { key: 'region', label: 'Region', type: 'text', required: true, placeholder: 'oss-cn-hangzhou' },
      { key: 'bucket', label: 'Bucket', type: 'text', required: true },
      { key: 'accessKeyId', label: 'AccessKey ID', type: 'text', required: true },
      { key: 'accessKeySecret', label: 'AccessKey Secret', type: 'password', required: true },
      { key: 'path', label: '存储路径', type: 'text', required: false, placeholder: 'images' },
      { key: 'cdnHost', label: 'CDN 域名', type: 'text', required: false, placeholder: 'https://cdn.example.com' },
      { key: 'useSSL', label: '使用 SSL', type: 'select', required: false, options: [{ label: '是', value: 'true' }, { label: '否', value: 'false' }] },
    ],
  },
  {
    id: 'txCOS',
    label: '腾讯云 COS',
    description: '通过 S3 兼容协议上传到腾讯云对象存储',
    fields: [
      { key: 'region', label: 'Region', type: 'text', required: true, placeholder: 'ap-guangzhou' },
      { key: 'bucket', label: 'Bucket', type: 'text', required: true },
      { key: 'secretId', label: 'SecretId', type: 'text', required: true },
      { key: 'secretKey', label: 'SecretKey', type: 'password', required: true },
      { key: 'path', label: '存储路径', type: 'text', required: false, placeholder: 'images' },
      { key: 'cdnHost', label: 'CDN 域名', type: 'text', required: false, placeholder: 'https://cdn.example.com' },
    ],
  },
  {
    id: 'qiniu',
    label: '七牛云',
    description: '上传到七牛云对象存储 Kodo',
    fields: [
      { key: 'accessKey', label: 'AccessKey', type: 'text', required: true },
      { key: 'secretKey', label: 'SecretKey', type: 'password', required: true },
      { key: 'bucket', label: 'Bucket', type: 'text', required: true },
      { key: 'region', label: '区域', type: 'select', required: true, options: [
        { label: '华东 (z0)', value: 'z0' },
        { label: '华北 (z1)', value: 'z1' },
        { label: '华南 (z2)', value: 'z2' },
        { label: '北美 (na0)', value: 'na0' },
        { label: '东南亚 (as0)', value: 'as0' },
      ]},
      { key: 'path', label: '存储路径', type: 'text', required: false, placeholder: 'images' },
      { key: 'domain', label: '域名', type: 'text', required: true, placeholder: 'https://cdn.example.com' },
    ],
  },
  {
    id: 'minio',
    label: 'MinIO',
    description: '上传到自建 MinIO 对象存储',
    fields: [
      { key: 'endpoint', label: 'Endpoint', type: 'text', required: true, placeholder: 'minio.example.com' },
      { key: 'port', label: '端口', type: 'text', required: false, placeholder: '9000' },
      { key: 'useSSL', label: '使用 SSL', type: 'select', required: false, options: [{ label: '否', value: 'false' }, { label: '是', value: 'true' }] },
      { key: 'bucket', label: 'Bucket', type: 'text', required: true },
      { key: 'accessKey', label: 'AccessKey', type: 'text', required: true },
      { key: 'secretKey', label: 'SecretKey', type: 'password', required: true },
    ],
  },
  {
    id: 's3',
    label: 'S3 兼容',
    description: '通用的 S3 兼容对象存储（AWS S3, Cloudflare R2 等）',
    fields: [
      { key: 'endpoint', label: 'Endpoint', type: 'text', required: false, placeholder: 'https://s3.amazonaws.com' },
      { key: 'region', label: 'Region', type: 'text', required: true, placeholder: 'us-east-1' },
      { key: 'bucket', label: 'Bucket', type: 'text', required: true },
      { key: 'accessKeyId', label: 'AccessKey ID', type: 'text', required: true },
      { key: 'accessKeySecret', label: 'SecretKey', type: 'password', required: true },
      { key: 'path', label: '存储路径', type: 'text', required: false, placeholder: 'images' },
      { key: 'cdnHost', label: 'CDN 域名', type: 'text', required: false, placeholder: 'https://cdn.example.com' },
      { key: 'pathStyle', label: 'Path Style', type: 'select', required: false, options: [{ label: '否 (Virtual Hosted)', value: 'false' }, { label: '是', value: 'true' }] },
    ],
  },
  {
    id: 'r2',
    label: 'Cloudflare R2',
    description: '上传到 Cloudflare R2 对象存储',
    fields: [
      { key: 'accountId', label: 'Account ID', type: 'text', required: true },
      { key: 'accessKey', label: 'AccessKey', type: 'text', required: true },
      { key: 'secretKey', label: 'SecretKey', type: 'password', required: true },
      { key: 'bucket', label: 'Bucket', type: 'text', required: true },
      { key: 'path', label: '存储路径', type: 'text', required: false, placeholder: 'images' },
      { key: 'domain', label: '公开域名', type: 'text', required: true, placeholder: 'https://cdn.example.com' },
    ],
  },
  {
    id: 'upyun',
    label: '又拍云',
    description: '上传到又拍云对象存储',
    fields: [
      { key: 'bucket', label: 'Bucket', type: 'text', required: true },
      { key: 'operator', label: '操作员', type: 'text', required: true },
      { key: 'password', label: '操作员密码', type: 'password', required: true },
      { key: 'path', label: '存储路径', type: 'text', required: false, placeholder: 'images' },
      { key: 'domain', label: '域名', type: 'text', required: true, placeholder: 'https://cdn.example.com' },
    ],
  },
  {
    id: 'telegram',
    label: 'Telegram',
    description: '通过 Telegram Bot API 上传图片',
    fields: [
      { key: 'token', label: 'Bot Token', type: 'password', required: true },
      { key: 'chatId', label: 'Chat ID', type: 'text', required: true },
    ],
  },
  {
    id: 'mp',
    label: '公众号',
    description: '上传到微信公众号素材库',
    fields: [
      { key: 'appID', label: 'AppID', type: 'text', required: true },
      { key: 'appsecret', label: 'AppSecret', type: 'password', required: true },
      { key: 'proxyOrigin', label: '代理域名（可选）', type: 'text', required: false, placeholder: 'https://your-proxy.com' },
    ],
  },
  {
    id: 'cloudinary',
    label: 'Cloudinary',
    description: '上传到 Cloudinary 云端图片管理平台',
    fields: [
      { key: 'cloudName', label: 'Cloud Name', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: false },
      { key: 'uploadPreset', label: 'Upload Preset', type: 'text', required: false },
      { key: 'folder', label: '目录', type: 'text', required: false, placeholder: 'blog/images' },
      { key: 'domain', label: '自定义域名', type: 'text', required: false, placeholder: 'https://cdn.example.com' },
    ],
  },
  {
    id: 'formCustom',
    label: '自定义',
    description: '编写自定义 JavaScript 上传代码',
    fields: [
      { key: 'code', label: '上传脚本', type: 'text', required: true },
    ],
  },
]

export function getBackend(id: string): BackendDef | undefined {
  return BACKENDS.find((b) => b.id === id)
}
