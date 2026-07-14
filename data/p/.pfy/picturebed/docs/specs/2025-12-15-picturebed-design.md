# Picturebed — 独立图床工具 设计文档

> **来源**：从 `thirdparty/md` 提取图床功能，完全独立，不引用 `@md/*` 任何包。

**Goal:** 一个独立部署的图床前端工具，支持 14 种后端上传，返回链接 + 完整管理（历史/搜索/批量/统计）。

**Architecture:** 纯前端 SPA（Vue 3 + Vite + Tailwind CSS）+ 复用 Go 后端代理。数据存 IndexedDB + localStorage，无服务端持久化依赖。Go 服务仅提供 Gitee API 代理、图片反代、通用 HTTP 代理。

**Tech Stack:** Vue 3 (Composition API + `<script setup>`), TypeScript, Vite 6, Tailwind CSS 4, Pinia, Vue Router, IndexedDB (idb), 图表库 (Chart.js 或轻量替代)

---

## 功能范围

### 上传
- 拖拽 / 点击上传，支持批量
- 14 种后端选择：GitHub, Gitee, 阿里云 OSS, 腾讯 COS, 七牛, MinIO, S3, R2, 又拍云, Telegram, 公众号, Cloudinary, 自定义代码, 默认(GitHub)
- 上传进度显示
- 成功后展示链接卡片（URL + 一键复制 + 缩略图）
- 支持压缩选项

### 历史
- 缩略图网格视图 + 列表视图
- 搜索：按文件名、后端类型、日期范围过滤
- 点击查看详情抽屉：原图预览、文件名、URL、大小、后端类型、上传日期
- 单条复制链接 / 删除
- 批量选择 → 批量复制 / 批量删除

### 统计
- 总上传次数、总容量
- 按后端分布（饼图）
- 按时间趋势（折线图/柱状图，周粒度）

### 配置
- 14 种后端各自独立折叠卡片
- 表单验证（必填字段校验）
- 密钥/Token 加密存储于 localStorage
- 测试连接按钮（可选）

---

## 架构

```
picturebed/
├── src/
│   ├── backends/        # 14 种上传后端，统一 UploadFn 接口
│   ├── stores/          # Pinia: upload, history, config, ui
│   ├── db/              # IndexedDB 封装
│   ├── composables/     # useUpload, useHistory, useImagePreview
│   ├── components/      # layout / upload / history / manage / stats / ui
│   └── utils/           # format, clipboard, thumbnail
├── server/              # Go 代理后端
│   └── main.go
└── DESIGN.md            # 暗色主题设计令牌
```

### 数据流
```
User Action → Component → Composable → Pinia Store → Backend / IndexedDB
                                                    │
                                           ┌────────┴────────┐
                                           ▼                 ▼
                                      14 backends        idb wrapper
                                      (直接 HTTP)        (history-db.ts)
```

---

## 视觉设计

见 `DESIGN.md` — 暗色主题 "Frame - Dark"，核心元素：

- **底色**: `#0F172A` (深蓝黑)
- **卡片**: `#1E293B` / hover `#334155`
- **主色调**: `#3B82F6` (蓝)
- **字体**: Inter (正文), JetBrains Mono (链接/代码)
- **圆角**: 6/10/14px 三级
- **间距**: 4/8/16/24/32px 五级

### 布局
- 左侧 56px 图标导航（上传/历史/统计/配置 + 底部亮暗切换）
- 右侧主内容区

---

## 错误处理

| 场景 | 策略 |
|------|------|
| 后端配置缺失 | toast 红色提示"请先配置 [后端名]" |
| Token/密钥过期 | 捕获 401/403，toast + 标记配置需更新 |
| 网络超时 | 30s 超时，toast + 支持重试 |
| 文件过大 | 前端校验，超限直接拒绝 |
| Gitee 代理不可达 | 连通性检测，不可达时置灰选项 |
| 自定义代码错误 | 展示具体错误行 + 堆栈 |

---

## Go 后端搬运范围

从 `docker/latest/server/main.go` 搬运 3 个端点：
- `POST /api/upload/gitee` — Gitee API v5 代理
- `GET /api/image/?url=` — 图片反代
- `GET /api/proxy/?url=` — 通用 HTTP 代理

去掉静文件服务、WebDAV/COS 存储逻辑。

---

## 后端接口

### 统一接口 `types.ts`
```typescript
interface BackendConfig {
  id: string;       // 'github' | 'gitee' | ...
  label: string;    // 'GitHub'
  fields: ConfigField[];  // 配置表单字段定义
}

interface ConfigField {
  key: string;      // 'token' | 'repo' | ...
  label: string;
  type: 'text' | 'password' | 'select';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];  // for select
}

interface UploadFn {
  (file: File, config: Record<string, string>, onProgress?: (pct: number) => void): Promise<UploadResult>;
}

interface UploadResult {
  url: string;
  filename: string;
  size: number;
  backend: string;
}
```

### IndexedDB Schema
```typescript
interface HistoryRecord {
  id: string;           // uuid
  url: string;
  filename: string;
  size: number;         // bytes
  backend: string;      // 'github' | 's3' | ...
  thumbnail: Blob;      // 缩略图 blob (max 200x200)
  createdAt: Date;
}
```
