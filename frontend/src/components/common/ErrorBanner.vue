<template>
  <div role="alert" class="flex flex-wrap items-center gap-3 border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-ink">
    <svg class="h-5 w-5 shrink-0 text-clay" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M8.5 3.1a1.7 1.7 0 0 1 3 0l5.4 9.6a1.7 1.7 0 0 1-1.5 2.5H4.6a1.7 1.7 0 0 1-1.5-2.5L8.5 3.1ZM10 7a.9.9 0 0 0-.9.9v2.4a.9.9 0 1 0 1.8 0V7.9A.9.9 0 0 0 10 7Zm0 6.6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
    </svg>
    <p class="flex-1">{{ message }}</p>
    <button v-if="retryable" type="button" class="border border-clay px-3 py-1 text-xs font-semibold text-clay transition hover:bg-clay hover:text-paper" @click="$emit('retry')">
      重试
    </button>
    <button v-if="dismissible" type="button" class="text-xs text-ink/60 underline-offset-2 hover:underline" @click="$emit('dismiss')">
      知道了
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: string; retryable?: boolean; dismissible?: boolean }>();
defineEmits<{ retry: []; dismiss: [] }>();
</script>
