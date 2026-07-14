/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'qiniu-js' {
  const qiniu: any
  export default qiniu
  export function upload(
    file: File,
    key: string,
    token: string,
    putExtra?: any,
    config?: any,
  ): any
}

declare module 'crypto-js' {
  const CryptoJS: any
  export default CryptoJS
}

declare module 'spark-md5' {
  class SparkMD5 {
    constructor()
    append(data: ArrayBuffer): void
    end(): string
    static ArrayBuffer: { new(): SparkMD5 }
  }
  export default SparkMD5
}
