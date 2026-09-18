<template>
  <article class="group mb-5 break-inside-avoid overflow-hidden bg-paper shadow-sm ring-1 ring-ink/10 transition hover:-translate-y-1 hover:shadow-xl">
    <SafeImage
      :src="image.imageUrl"
      :alt="image.sourceDescription"
      img-class="aspect-[4/5] w-full object-cover"
      fallback-class="aspect-[4/5] w-full"
    />
    <div class="space-y-3 p-4">
      <div class="flex items-center justify-between">
        <StyleTag :style-name="image.style" />
        <span class="text-xs uppercase tracking-widest text-ink/50">{{ image.roomType }}</span>
      </div>
      <p class="font-display text-xl text-ink">{{ image.sourceDescription }}</p>
      <div class="flex flex-wrap gap-2">
        <span v-for="tag in image.tags" :key="tag" class="bg-ink/5 px-2 py-1 text-xs text-ink/70">{{ tag }}</span>
      </div>
      <button
        class="w-full px-4 py-2 text-sm font-semibold text-paper transition"
        :class="collected ? 'cursor-default bg-moss' : 'bg-ink hover:bg-clay'"
        :disabled="collected"
        @click="!collected && $emit('collect', image)"
      >
        {{ collected ? '已在该灵感板中' : '收藏到灵感板' }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { InspirationImage } from '../../types';
import SafeImage from './SafeImage.vue';
import StyleTag from './StyleTag.vue';

withDefaults(defineProps<{ image: InspirationImage; collected?: boolean }>(), { collected: false });
defineEmits<{ collect: [image: InspirationImage] }>();
</script>
