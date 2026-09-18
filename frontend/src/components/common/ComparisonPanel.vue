<template>
  <article class="bg-paper p-6 ring-1 ring-ink/10">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display text-3xl text-ink">{{ plan.name }}</h3>
        <p class="mt-1 text-xs text-ink/50">{{ board?.description || '灵感板暂无描述' }}</p>
      </div>
      <button type="button" class="shrink-0 text-xs text-ink/50 underline-offset-2 hover:text-clay hover:underline" @click="$emit('remove', plan.id)">
        移出对比
      </button>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <StyleTag v-for="style in plan.styleTags" :key="style" :style-name="style" />
      <span v-if="!plan.styleTags.length" class="text-xs text-ink/50">板内还没有图片，暂时无法推导风格标签</span>
    </div>

    <div class="mt-6">
      <p class="mb-2 text-xs uppercase tracking-widest text-ink/50">颜色方案</p>
      <div class="flex flex-wrap items-center gap-3">
        <template v-if="plan.colors.length">
          <ColorSwatch v-for="color in plan.colors" :key="color" :color="color" />
        </template>
        <span v-else class="text-xs text-ink/50">收藏图片后自动同步颜色</span>
      </div>
    </div>

    <div class="mt-6">
      <p class="mb-2 text-xs uppercase tracking-widest text-ink/50">灵感板图片（{{ images.length }}）</p>
      <div v-if="images.length" class="grid grid-cols-4 gap-2">
        <img
          v-for="image in images"
          :key="image.id"
          :src="image.imageUrl"
          :alt="image.sourceDescription"
          class="aspect-square w-full object-cover"
          @error="(e: Event) => ((e.target as HTMLImageElement).style.opacity = '0.2')"
        />
      </div>
      <EmptyState v-else text="灵感板为空，先去图集收藏图片" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { ComparisonPlan, InspirationImage, MoodBoard } from '../../types';
import ColorSwatch from './ColorSwatch.vue';
import EmptyState from './EmptyState.vue';
import StyleTag from './StyleTag.vue';

defineProps<{ plan: ComparisonPlan; board?: MoodBoard; images: InspirationImage[] }>();
defineEmits<{ remove: [planId: string] }>();
</script>
