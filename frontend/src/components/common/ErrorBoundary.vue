<template>
  <slot v-if="!failed" />
  <div v-else class="flex flex-col items-center gap-3 border border-dashed border-ink/30 bg-paper/70 p-8 text-center" role="alert">
    <p class="text-sm font-semibold text-ink">该区域暂时无法显示</p>
    <p class="text-xs text-ink/60">本地数据或渲染出现异常，重试后通常可以恢复。</p>
    <button class="bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-clay" @click="failed = false">重试</button>
  </div>
</template>

<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';

/**
 * 局部错误边界：捕获子组件渲染期异常，降级为可重试提示，
 * 避免单个面板（雷达图 / 拖拽网格等）异常拖垮整页。
 */
const failed = ref(false);
defineProps<{ name?: string }>();

onErrorCaptured((error) => {
  failed.value = true;
  // eslint-disable-next-line no-console
  console.error('[ErrorBoundary]', error);
  return false; // 阻止错误继续向全局冒泡
});
</script>
