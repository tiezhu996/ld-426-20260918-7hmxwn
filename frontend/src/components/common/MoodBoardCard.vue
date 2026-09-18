<template>
  <article
    class="overflow-hidden bg-paper ring-1 transition"
    :class="selected ? 'ring-2 ring-clay' : 'ring-ink/10 hover:ring-clay/50'"
  >
    <button type="button" class="block w-full text-left" @click="$emit('select', board.id)">
      <SafeImage
        v-if="board.coverImageUrl"
        :src="board.coverImageUrl"
        :alt="board.name"
        img-class="h-44 w-full object-cover"
        fallback-class="h-44 w-full"
      />
      <div v-else class="flex h-44 w-full items-center justify-center bg-ink/5 text-xs text-ink/50">暂无封面 · 收藏图片后自动生成</div>
    </button>
    <div class="space-y-3 p-5">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-display text-2xl text-ink">{{ board.name }}</h3>
        <span class="shrink-0 rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/60">{{ board.imageIds.length }} 张</span>
      </div>
      <p class="text-sm text-ink/70">{{ board.description || '暂无描述' }}</p>
      <div v-if="thumbnails.length" class="flex gap-1.5">
        <SafeImage
          v-for="thumb in thumbnails"
          :key="thumb.id"
          :src="thumb.imageUrl"
          :alt="thumb.sourceDescription"
          img-class="h-12 w-12 object-cover"
          fallback-class="h-12 w-12"
        />
      </div>
      <div class="flex gap-2">
        <span v-for="tag in board.tags" :key="tag" class="bg-moss/10 px-2 py-1 text-xs text-moss">{{ tag }}</span>
      </div>
      <div class="flex justify-between pt-1">
        <button type="button" class="text-xs font-semibold text-clay hover:underline" @click="$emit('select', board.id)">
          {{ selected ? '当前查看中' : '查看并排列图片' }}
        </button>
        <button v-if="removable" type="button" class="text-xs text-ink/40 hover:text-clay" @click="$emit('remove', board.id)">删除</button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { InspirationImage, MoodBoard } from '../../types';
import SafeImage from './SafeImage.vue';

const props = withDefaults(
  defineProps<{ board: MoodBoard; images?: InspirationImage[]; selected?: boolean; removable?: boolean }>(),
  { images: () => [], selected: false, removable: false }
);
defineEmits<{ select: [id: string]; remove: [id: string] }>();

const thumbnails = computed(() => props.images.slice(0, 4));
</script>
