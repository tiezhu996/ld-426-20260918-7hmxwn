<template>
  <label class="flex flex-col gap-1.5">
    <span class="text-xs font-semibold uppercase tracking-widest text-ink/50">选择灵感板</span>
    <select
      class="border border-ink/20 bg-paper px-3 py-2 text-sm text-ink focus:border-clay focus:outline-none"
      :value="modelValue ?? ''"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value || undefined)"
    >
      <option value="" disabled>{{ boards.length ? '请先选择一个已有灵感板' : '暂无灵感板' }}</option>
      <option v-for="board in boards" :key="board.id" :value="board.id">
        {{ board.name }}（{{ board.imageIds.length }} 张）
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
import { MoodBoard } from '../../types';

/**
 * 收藏前置选择器：图集收藏必须先选定一个「已存在」的灵感板。
 * 不承担新建职责（新建走灵感板页），空列表时由父组件引导跳转。
 */
defineProps<{ boards: MoodBoard[]; modelValue?: string }>();
defineEmits<{ 'update:modelValue': [value?: string] }>();
</script>
