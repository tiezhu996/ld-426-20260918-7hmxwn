<template>
  <label class="flex items-center gap-3 text-sm">
    <span class="shrink-0 font-semibold text-ink/70">收藏到灵感板</span>
    <select
      :value="modelValue ?? ''"
      class="min-w-0 flex-1 border border-ink/20 bg-paper px-3 py-2 text-ink focus:border-clay focus:outline-none"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value || null)"
    >
      <option value="" disabled>请选择已有灵感板</option>
      <option v-for="board in boards" :key="board.id" :value="board.id">
        {{ board.name }}（{{ board.imageIds.length }} 张）
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
import { MoodBoard } from '../../types';

defineProps<{ boards: MoodBoard[]; modelValue: string | null }>();
defineEmits<{ 'update:modelValue': [value: string | null] }>();
</script>
