<template>
  <section class="space-y-7">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.25em] text-clay">Gallery</p>
        <h1 class="page-title mt-3">按风格和空间筛选灵感</h1>
      </div>
      <div class="space-y-3">
        <FilterTabs v-model="styleValue" :items="styleItems" />
        <FilterTabs v-model="roomValue" :items="roomItems" />
      </div>
    </div>

    <div class="grid gap-4 bg-paper p-4 ring-1 ring-ink/10 lg:grid-cols-[1fr_auto] lg:items-center">
      <BoardPicker :boards="boards.boards" :model-value="boards.selectedBoardId" @update:model-value="onSelectBoard" />
      <RouterLink to="/moodboards" class="text-sm font-semibold text-clay underline-offset-2 hover:underline">
        或先去新建一个灵感板 →
      </RouterLink>
    </div>

    <ErrorBanner
      v-if="loadError"
      :message="loadError"
      retryable
      @retry="init"
      @dismiss="loadError = ''"
    />
    <ErrorBanner v-if="actionError" :message="actionError" :retryable="false" dismissible @dismiss="actionError = ''" />
    <p v-if="toast" class="bg-moss/10 px-4 py-2 text-sm text-moss">{{ toast }}</p>

    <div v-if="store.filteredImages.length" class="columns-1 gap-5 md:columns-2 xl:columns-3">
      <ImageCard
        v-for="image in store.filteredImages"
        :key="image.id"
        :image="image"
        :collected="store.isCollected(image.id)"
        :can-collect="Boolean(boards.selectedBoardId)"
        @collect="collect"
      />
    </div>
    <EmptyState v-else-if="!loadError" text="当前筛选下没有灵感图片，试试切换风格或空间类型">
      <button type="button" class="border border-ink/30 px-4 py-2 text-sm hover:bg-ink hover:text-paper" @click="clearFilters">
        清除筛选
      </button>
    </EmptyState>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import BoardPicker from '../components/common/BoardPicker.vue';
import EmptyState from '../components/common/EmptyState.vue';
import ErrorBanner from '../components/common/ErrorBanner.vue';
import FilterTabs from '../components/common/FilterTabs.vue';
import ImageCard from '../components/common/ImageCard.vue';
import { useInspirationStore } from '../stores/inspirationStore';
import { useMoodboardStore } from '../stores/moodboardStore';
import { DecorStyle, describeError, InspirationImage, RoomType } from '../types';
import { resetDbConnection } from '../utils/db';

const store = useInspirationStore();
const boards = useMoodboardStore();
const styleItems = Object.values(DecorStyle);
const roomItems = Object.values(RoomType);
const styleValue = computed({
  get: () => store.styleFilter,
  set: (value) => (store.styleFilter = value as DecorStyle | undefined)
});
const roomValue = computed({
  get: () => store.roomFilter,
  set: (value) => (store.roomFilter = value as RoomType | undefined)
});

const loadError = ref('');
const actionError = ref('');
const toast = ref('');
let toastTimer: ReturnType<typeof setTimeout> | undefined;

function showToast(message: string) {
  toast.value = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value = ''), 2200);
}

function onSelectBoard(boardId: string | null) {
  if (boardId) boards.selectBoard(boardId);
}

function clearFilters() {
  store.styleFilter = undefined;
  store.roomFilter = undefined;
}

async function collect(image: InspirationImage) {
  actionError.value = '';
  const boardId = boards.selectedBoardId;
  if (!boardId) {
    actionError.value = '请先从上方选择一个已有灵感板，再收藏图片。';
    return;
  }
  try {
    const result = await boards.addImage(boardId, image.id);
    await store.refreshCollected();
    showToast(result.added ? `已收藏到「${boards.selectedBoard?.name ?? ''}」` : '这张图片已在该灵感板中，不会重复添加');
  } catch (error) {
    actionError.value = describeError(error, '收藏失败，请重试');
  }
}

async function init() {
  loadError.value = '';
  resetDbConnection();
  try {
    await store.seed();
    await boards.load();
  } catch (error) {
    loadError.value = describeError(error, '本地数据读取失败，请点击重试');
  }
}

onMounted(init);
</script>
