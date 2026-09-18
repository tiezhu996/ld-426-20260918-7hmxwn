<template>
  <article class="bg-paper p-6 ring-1 ring-ink/10">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display text-3xl text-ink">{{ plan.name }}</h3>
        <p v-if="board" class="mt-1 text-xs text-ink/50">来源灵感板：{{ board.name }}（{{ board.imageIds.length }} 张）</p>
      </div>
      <button type="button" class="text-xs text-ink/40 hover:text-clay" @click="$emit('remove', plan.id)">移除</button>
    </div>

    <div class="mt-4">
      <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-ink/50">风格标签（随灵感板同步）</p>
      <div v-if="plan.styleTags.length" class="flex flex-wrap gap-2">
        <StyleTag v-for="style in plan.styleTags" :key="style" :style-name="style" />
      </div>
      <p v-else class="text-xs text-ink/50">灵感板内暂无图片，收藏图片后自动生成风格标签</p>
    </div>

    <div class="mt-6">
      <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-ink/50">颜色方案</p>
      <div v-if="plan.colors.length" class="flex gap-3">
        <ColorSwatch v-for="color in plan.colors" :key="color" :color="color" />
      </div>
      <p v-else class="text-xs text-ink/50">暂无颜色</p>
    </div>

    <div v-if="previewImages.length" class="mt-6 grid grid-cols-4 gap-2">
      <SafeImage
        v-for="image in previewImages"
        :key="image.id"
        :src="image.imageUrl"
        :alt="image.sourceDescription"
        img-class="aspect-square w-full object-cover"
        fallback-class="aspect-square w-full"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ComparisonPlan, InspirationImage, MoodBoard } from '../../types';
import { useInspirationStore } from '../../stores/inspirationStore';
import ColorSwatch from './ColorSwatch.vue';
import SafeImage from './SafeImage.vue';
import StyleTag from './StyleTag.vue';

const props = defineProps<{ plan: ComparisonPlan; board?: MoodBoard }>();
defineEmits<{ remove: [id: string] }>();

const inspirations = useInspirationStore();
const previewImages = computed<InspirationImage[]>(() => (props.board ? inspirations.getImages(props.board.imageIds).slice(0, 4) : []));
</script>
