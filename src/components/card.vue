<script setup lang="ts">
import { computed } from 'vue'
import type { CardNode } from '../types/type'

interface Props {
  node: CardNode
  isDock?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['clickCard'])

// 加载图片资源
const modules = import.meta.glob('../assets/cow2/*.png', {
  as: 'url',
  import: 'default',
  eager: true,
})
const IMG_MAP = Object.keys(modules).reduce((acc, cur) => {
  const key = cur.replace('../assets/cow2/', '').replace('.png', '')
  acc[key] = modules[cur] as string
  return acc
}, {} as Record<string, string>)
const isFreeze = computed(() => {
  return props.node.parents.length > 0 ? props.node.parents.some(o => o.state < 2) : false
},
)

function handleClick() {
  if (!isFreeze.value)
    emit('clickCard', props.node)
}
</script>

<template>
  <div
    class="card"
    :style="isDock ? {} : { position: 'absolute', zIndex: node.zIndex, top: `${node.top}px`, left: `${node.left}px` }"
    @click="handleClick"
  >
    <!-- {{ node.zIndex }}-{{ node.type }} -->
    <!-- {{ node.id }} -->
    <img :src="IMG_MAP[node.type]" :alt="`${node.type}`">
    <div v-if="isFreeze" class="mask" />
  </div>
</template>

<style scoped>
/* 自适应卡片样式 */
.card{
  width: clamp(35px, 8.5vw, 60px);
  height: clamp(35px, 8.5vw, 60px);
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  color:#000;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: clamp(6px, 1.5vw, 10px);
  border: clamp(1px, 0.3vw, 2px) solid rgba(0, 0, 0, 0.15);
  box-shadow: 0 clamp(2px, 0.5vw, 4px) clamp(8px, 2vw, 12px) rgba(0, 0, 0, 0.1);
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.3s ease;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8), transparent);
  pointer-events: none;
}

/* 只在大屏设备上启用悬停效果 */
@media (hover: hover) and (pointer: fine) {
  .card:hover {
    transform: translateY(clamp(-2px, -0.5vw, -3px)) scale(1.02);
    box-shadow: 0 clamp(4px, 1vw, 6px) clamp(12px, 3vw, 16px) rgba(0, 0, 0, 0.2);
    border-color: rgba(102, 126, 234, 0.3);
    background: linear-gradient(135deg, #ffffff, #f1f3f4);
  }
}

/* 触摸设备的反馈效果 */
@media (hover: none) and (pointer: coarse) {
  .card:active {
    transform: scale(0.95);
    box-shadow: clamp(1px, 0.2vw, 2px) clamp(1px, 0.4vw, 3px) clamp(1px, 0.4vw, 3px) -1px #000;
  }
}

/* 手机端卡片优化 */
@media (max-width: 600px) {
  .card {
    width: clamp(32px, 8vw, 45px);
    height: clamp(32px, 8vw, 45px);
    border-radius: clamp(3px, 0.8vw, 5px);
    border: clamp(1px, 0.3vw, 2px) solid #000;
  }
}

img{
  width: 100%;
  height: 100%;
  border-radius: 4px;
  object-fit: cover;
}

.mask {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.55);
  width: 100%;
  height: 100%;
  border-radius: 4px;
  pointer-events: none;
}

/* 移除所有固定断点，使用完全自适应的设计 */
</style>
