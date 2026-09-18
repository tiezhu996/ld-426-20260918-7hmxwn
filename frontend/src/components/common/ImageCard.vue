<template>
  <article class="group mb-5 break-inside-avoid overflow-hidden bg-paper shadow-sm ring-1 ring-ink/10 transition hover:-translate-y-1 hover:shadow-xl">
    <template v-if="!failed">
      <img
        :key="reloadKey"
        :src="image.imageUrl"
        :alt="image.sourceDescription"
        class="aspect-[4/5] w-full object-cover"
        @error="failed = true"
      />
    </template>
    <div v-else class="relative flex aspect-[4/5] flex-col items-center justify-center gap-3 bg-ink/10 text-sm text-ink/60">
      <img :src="IMAGE_FALLBACK" alt="" class="absolute inset-0 h-full w-full object-cover opacity-60" />
      <p class="relative">图片加载失败</p>
      <button type="button" class="relative border border-ink/30 px-3 py-1 text-xs font-semibold hover:bg-ink hover:text-paper" @click="retryImage">
        重新加载
      </button>
    </div>
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
        type="button"
        class="w-full px-4 py-2 text-sm font-semibold transition"
        :class="collected ? 'cursor-default bg-moss/15 text-moss' : 'bg-ink text-paper hover:bg-clay'"
        :disabled="collected || !canCollect"
        @click="$emit('collect', image)"
      >
        {{ collected ? '已收藏' : canCollect ? '收藏到灵感板' : '请先在上方选择灵感板' }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IMAGE_FALLBACK } from '../../constants/placeholders';
import { InspirationImage } from '../../types';
import StyleTag from './StyleTag.vue';

withDefaults(defineProps<{ image: InspirationImage; collected?: boolean; canCollect?: boolean }>(), {
  collected: false,
  canCollect: true
});
defineEmits<{ collect: [image: InspirationImage] }>();

const failed = ref(false);
const reloadKey = ref(0);

function retryImage() {
  failed.value = false;
  reloadKey.value += 1;
}
</script>
