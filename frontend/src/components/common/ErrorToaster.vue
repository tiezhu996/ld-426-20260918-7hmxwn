<template>
  <div class="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,22rem)] flex-col gap-2">
    <div
      v-for="notice in errors.notices"
      :key="notice.id"
      class="pointer-events-auto flex items-start gap-3 border border-clay/40 bg-paper p-4 shadow-xl ring-1 ring-ink/10"
      role="alert"
    >
      <span class="mt-0.5 text-clay" aria-hidden="true">⚠</span>
      <div class="flex-1">
        <p class="text-sm font-semibold text-ink">{{ kindLabel(notice.kind) }}</p>
        <p class="mt-1 text-xs leading-relaxed text-ink/70">{{ notice.message }}</p>
        <div class="mt-2 flex gap-3">
          <button v-if="notice.retryable && notice.retry" class="text-xs font-semibold text-clay hover:underline" type="button" @click="notice.retry">重试</button>
          <button class="text-xs text-ink/50 hover:text-ink" type="button" @click="errors.dismiss(notice.id)">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useErrorStore } from '../../stores/errorStore';
import { AppErrorKind } from '../../types';

const errors = useErrorStore();

function kindLabel(kind: AppErrorKind) {
  return kind === 'storage' ? '本地存储异常' : kind === 'image' ? '图片加载异常' : '出现异常';
}
</script>