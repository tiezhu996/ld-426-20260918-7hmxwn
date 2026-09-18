<template>
  <div class="relative">
    <img
      v-if="!failed"
      :src="resolvedSrc"
      :alt="alt"
      :class="imgClass"
      @error="handleError"
    />
    <div v-else :class="['flex flex-col items-center justify-center gap-2 bg-ink/10 text-center', fallbackClass]" role="img" :aria-label="`${alt}（图片加载失败）`">
      <span class="text-xs text-ink/60">图片暂时无法显示</span>
      <button class="border border-ink/30 px-2 py-1 text-[11px] text-ink/70 hover:border-clay hover:text-clay" type="button" @click="retry">重新加载</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * 统一的图片兜底组件：加载失败时展示「可恢复」占位而不是破图，
 * 用户可手动重新加载（附加时间戳绕开失败缓存）。
 */
const props = withDefaults(
  defineProps<{
    src: string;
    alt: string;
    imgClass?: string;
    fallbackClass?: string;
  }>(),
  { imgClass: '', fallbackClass: 'aspect-square' }
);

const failed = ref(false);
const bust = ref(0);

const resolvedSrc = computed(() => {
  if (!bust.value) return props.src;
  const separator = props.src.includes('?') ? '&' : '?';
  return `${props.src}${separator}_retry=${bust.value}`;
});

function handleError() {
  failed.value = true;
}

function retry() {
  bust.value += 1;
  failed.value = false;
}
</script>