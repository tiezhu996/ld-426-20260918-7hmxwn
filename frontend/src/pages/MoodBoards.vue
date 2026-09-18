<template>
  <section class="space-y-7">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.25em] text-clay">Moodboards</p>
        <h1 class="page-title mt-3">把收藏重排成方案线索</h1>
      </div>
    </div>

    <ErrorBanner v-if="loadError" :message="loadError" retryable @retry="init" @dismiss="loadError = ''" />
    <ErrorBanner v-if="actionError" :message="actionError" dismissible @dismiss="actionError = ''" />

    <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div>
        <div v-if="boards.boards.length" class="grid gap-5 md:grid-cols-2">
          <MoodBoardCard
            v-for="board in boards.boards"
            :key="board.id"
            :board="board"
            :styles="boardStyles(board.id)"
            :selected="board.id === boards.selectedBoardId"
            @select="selectBoard"
          />
        </div>
        <EmptyState v-else-if="!loadError" text="还没有灵感板，先在右侧创建一个，再去图集收藏图片">
          <RouterLink to="/gallery" class="border border-ink/30 px-4 py-2 text-sm hover:bg-ink hover:text-paper">去灵感图集</RouterLink>
        </EmptyState>
      </div>
      <NewBoardForm @create="createBoard" />
    </div>

    <div v-if="currentBoard" class="bg-paper p-6 ring-1 ring-ink/10">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="font-display text-3xl text-ink">{{ currentBoard.name }} · 拖拽排列</h2>
        <p class="text-xs text-ink/50" :class="{ 'text-moss': saveHint === '已保存' }">{{ saveHint }}</p>
      </div>
      <DraggableGrid class="mt-5" :images="selectedImages" @reorder="persistOrder" />
    </div>
    <EmptyState v-else-if="boards.loaded && !boards.boards.length && !loadError" text="创建灵感板后，可以在这里拖拽整理图片顺序" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import DraggableGrid from '../components/common/DraggableGrid.vue';
import ErrorBanner from '../components/common/ErrorBanner.vue';
import MoodBoardCard from '../components/common/MoodBoardCard.vue';
import NewBoardForm from '../components/common/NewBoardForm.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useInspirationStore } from '../stores/inspirationStore';
import { useMoodboardStore } from '../stores/moodboardStore';
import { DecorStyle, describeError, InspirationImage, NewBoardInput } from '../types';
import { deriveBoardStyles } from '../utils/boardMeta';
import { resetDbConnection } from '../utils/db';

const boards = useMoodboardStore();
const inspirations = useInspirationStore();

const loadError = ref('');
const actionError = ref('');
const saveHint = ref('');
const selectedImages = ref<InspirationImage[]>([]);

const currentBoard = computed(() => boards.selectedBoard);
const imageMap = computed(() => inspirations.imageMap);

function boardStyles(boardId: string): DecorStyle[] {
  const board = boards.boards.find((item) => item.id === boardId);
  if (!board) return [];
  const images = board.imageIds.map((id) => imageMap.value.get(id)).filter(Boolean) as InspirationImage[];
  return deriveBoardStyles(images);
}

function syncSelectedImages() {
  const board = currentBoard.value;
  selectedImages.value = board
    ? (board.imageIds.map((id) => imageMap.value.get(id)).filter(Boolean) as InspirationImage[])
    : [];
}

watch(currentBoard, syncSelectedImages);

function selectBoard(boardId: string) {
  actionError.value = '';
  boards.selectBoard(boardId);
}

async function persistOrder(images: InspirationImage[]) {
  selectedImages.value = images;
  const board = currentBoard.value;
  if (!board) return;
  saveHint.value = '保存中…';
  try {
    await boards.reorder(board.id, images.map((image) => image.id));
    saveHint.value = '已保存';
  } catch (error) {
    saveHint.value = '';
    actionError.value = describeError(error, '拖拽结果保存失败，请重试');
    syncSelectedImages();
  }
}

async function createBoard(input: NewBoardInput) {
  actionError.value = '';
  try {
    await boards.createBoard(input);
  } catch (error) {
    actionError.value = describeError(error, '新建灵感板失败，请重试');
  }
}

async function init() {
  loadError.value = '';
  resetDbConnection();
  try {
    await inspirations.seed();
    await boards.load();
    syncSelectedImages();
  } catch (error) {
    loadError.value = describeError(error, '本地数据读取失败，请点击重试');
  }
}

onMounted(init);
</script>
