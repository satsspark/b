// Vue 全局类型文件
import type { ComponentCustomProperties } from 'vue'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    // 这里可以添加全局属性的类型定义
  }
}

export {}
