<template>
  <slot v-if="!errorMessage" />
  <div v-else role="alert" class="m-6 border border-clay/40 bg-clay/10 p-8 text-center">
    <h2 class="font-display text-2xl text-ink">页面渲染出现异常</h2>
    <p class="mt-3 text-sm text-ink/70">{{ errorMessage }}</p>
    <p class="mt-1 text-xs text-ink/50">你的本地数据没有丢失，可以尝试恢复。</p>
    <div class="mt-5 flex justify-center gap-3">
      <button type="button" class="bg-clay px-4 py-2 text-sm font-semibold text-paper" @click="recover">重试渲染</button>
      <button type="button" class="border border-ink/30 px-4 py-2 text-sm" @click="reload">刷新页面</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';

const errorMessage = ref('');

onErrorCaptured((error: unknown) => {
  errorMessage.value = error instanceof Error ? error.message : '未知渲染异常';
  return false;
});

function recover() {
  errorMessage.value = '';
}

function reload() {
  window.location.reload();
}
</script>
