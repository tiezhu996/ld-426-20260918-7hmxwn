<template>
  <article
    class="cursor-pointer overflow-hidden bg-paper ring-1 transition"
    :class="selected ? 'ring-2 ring-clay' : 'ring-ink/10 hover:ring-clay/50'"
    @click="$emit('select', board.id)"
  >
    <div class="relative">
      <img
        v-if="board.coverImageUrl && !coverFailed"
        :src="board.coverImageUrl"
        :alt="board.name"
        class="h-44 w-full object-cover"
        @error="coverFailed = true"
      />
      <div v-else class="flex h-44 items-center justify-center bg-ink/10 text-sm text-ink/50">
        {{ board.imageIds.length ? '封面加载失败' : '空灵感板' }}
      </div>
      <span v-if="selected" class="absolute right-3 top-3 bg-clay px-2 py-1 text-xs font-semibold text-paper">当前选中</span>
    </div>
    <div class="space-y-3 p-5">
      <div class="flex items-center justify-between gap-2">
        <h3 class="font-display text-2xl text-ink">{{ board.name }}</h3>
        <span class="shrink-0 text-xs text-ink/50">{{ board.imageIds.length }} 张</span>
      </div>
      <p class="text-sm text-ink/70">{{ board.description || '暂无描述' }}</p>
      <div v-if="styles.length" class="flex flex-wrap gap-2">
        <StyleTag v-for="style in styles" :key="style" :style-name="style" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { DecorStyle, MoodBoard } from '../../types';
import StyleTag from './StyleTag.vue';

withDefaults(defineProps<{ board: MoodBoard; styles?: DecorStyle[]; selected?: boolean }>(), {
  styles: () => [],
  selected: false
});
defineEmits<{ select: [boardId: string] }>();
const coverFailed = ref(false);
</script>
