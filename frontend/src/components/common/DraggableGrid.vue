<template>
  <div>
    <VueDraggable
      v-if="images.length"
      v-model="localImages"
      :animation="180"
      class="grid grid-cols-2 gap-3 md:grid-cols-4"
      handle=".drag-handle"
    >
      <div v-for="image in localImages" :key="image.id" class="group relative">
        <SafeImage
          :src="image.imageUrl"
          :alt="image.sourceDescription"
          img-class="aspect-square w-full cursor-grab object-cover active:cursor-grabbing"
          fallback-class="aspect-square w-full cursor-grab active:cursor-grabbing"
        />
        <span class="drag-handle absolute left-1 top-1 rounded bg-ink/60 px-1.5 py-0.5 text-[10px] text-paper opacity-0 transition group-hover:opacity-100">⋮⋮ 拖动</span>
      </div>
    </VueDraggable>
    <div v-else class="flex h-40 items-center justify-center border border-dashed border-ink/20 text-sm text-ink/50">
      这个灵感板还没有图片，去图集收藏后再来拖拽排列
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { InspirationImage } from '../../types';
import SafeImage from './SafeImage.vue';

const props = defineProps<{ images: InspirationImage[] }>();
const emit = defineEmits<{
  reorder: [images: InspirationImage[]];
  reorderIds: [ids: string[]];
}>();

const localImages = computed({
  get: () => props.images,
  set: (value) => {
    emit('reorder', value);
    emit('reorderIds', value.map((image) => image.id));
  }
});
</script>
