<template>
  <div>
    <p v-if="images.length" class="mb-3 text-xs uppercase tracking-widest text-ink/50">拖拽卡片即可调整顺序，结果会自动保存</p>
    <VueDraggable
      v-model="localImages"
      :animation="180"
      class="grid grid-cols-2 gap-3 md:grid-cols-4"
      :class="{ 'border border-dashed border-ink/20 p-4': images.length }"
    >
      <div v-for="image in localImages" :key="image.id" class="relative cursor-grab active:cursor-grabbing">
        <img
          v-if="!failed[image.id]"
          :src="image.imageUrl"
          :alt="image.sourceDescription"
          class="aspect-square w-full object-cover"
          draggable="false"
          @error="failed[image.id] = true"
        />
        <div v-else class="flex aspect-square items-center justify-center bg-ink/10 text-xs text-ink/50">
          <img :src="IMAGE_FALLBACK" alt="" class="h-full w-full object-cover opacity-50" />
        </div>
      </div>
    </VueDraggable>
    <EmptyState v-if="!images.length" text="这个灵感板还没有图片，去灵感图集收藏几张吧" />
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { IMAGE_FALLBACK } from '../../constants/placeholders';
import { InspirationImage } from '../../types';
import EmptyState from './EmptyState.vue';

const props = defineProps<{ images: InspirationImage[] }>();
const emit = defineEmits<{ reorder: [images: InspirationImage[]] }>();
const failed = reactive<Record<string, boolean>>({});

const localImages = computed({
  get: () => props.images,
  set: (value) => emit('reorder', value)
});
</script>
