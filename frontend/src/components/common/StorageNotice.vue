<template>
  <div class="flex flex-wrap items-center gap-3 border border-ochre/50 bg-ochre/10 px-4 py-3" role="alert">
    <span class="text-sm font-semibold text-ink">⚠ 本地存储当前不可用</span>
    <span class="text-xs text-ink/70">{{ text }}</span>
    <button type="button" class="ml-auto bg-ink px-3 py-1.5 text-xs font-semibold text-paper hover:bg-clay" @click="$emit('retry')">重试连接</button>
    <button type="button" class="text-xs text-ink/50 hover:text-ink" @click="$emit('dismiss')">知道了</button>
  </div>
</template>

<script setup lang="ts">
/**
 * 存储降级横幅：IndexedDB 异常但应用已用内存 / 备份数据继续运行时展示，
 * 提供「重试连接」入口，属于可恢复提示而非致命错误。
 */
withDefaults(defineProps<{ text?: string }>(), {
  text: '数据暂时只保留在当前页面，恢复后可重新写入本地。'
});
defineEmits<{ retry: []; dismiss: [] }>();
</script>
