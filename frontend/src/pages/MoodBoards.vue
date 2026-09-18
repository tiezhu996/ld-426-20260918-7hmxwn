<template>
  <section class="space-y-7">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.25em] text-clay">Moodboards</p>
        <h1 class="page-title mt-3">把收藏重排成方案线索</h1>
      </div>
      <button class="bg-ink px-5 py-3 font-semibold text-paper hover:bg-clay" :disabled="creating" @click="create()">
        {{ creating ? '创建中…' : '新建灵感板' }}
      </button>
    </div>

    <p v-if="message" class="text-sm font-semibold" :class="messageOk ? 'text-moss' : 'text-ochre'">{{ message }}</p>

    <StorageNotice v-if="showDegraded || boards.storageDegraded" text="灵感板暂时无法写入本地，恢复后点击重试。" @retry="boot()" @dismiss="dismissDegraded" />

    <EmptyState v-if="!boards.hasBoards && !bootLoading" text="还没有灵感板，点击右上角「新建灵感板」开始收集" />

    <div class="grid gap-5 lg:grid-cols-3">
      <MoodBoardCard
        v-for="board in boards.boards"
        :key="board.id"
        :board="board"
        :images="boardImages(board.id)"
        :selected="board.id === selectedBoardId"
        removable
        @select="selectBoard"
        @remove="removeBoard"
      />
    </div>

    <div v-if="selectedBoard" class="bg-paper p-6 ring-1 ring-ink/10">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-display text-3xl text-ink">拖拽排列 · {{ selectedBoard.name }}</h2>
        <span class="text-xs text-ink/50">拖动图片调整顺序，松手即自动保存，刷新后仍保留</span>
      </div>
      <ErrorBoundary name="draggable-grid">
        <DraggableGrid class="mt-5" :images="selectedImages" @reorder-ids="persistOrder" />
      </ErrorBoundary>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import DraggableGrid from '../components/common/DraggableGrid.vue';
import EmptyState from '../components/common/EmptyState.vue';
import ErrorBoundary from '../components/common/ErrorBoundary.vue';
import MoodBoardCard from '../components/common/MoodBoardCard.vue';
import StorageNotice from '../components/common/StorageNotice.vue';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useErrorStore } from '../stores/errorStore';
import { useInspirationStore } from '../stores/inspirationStore';
import { useMoodboardStore } from '../stores/moodboardStore';
import { InspirationImage, toAppError } from '../types';

const boards = useMoodboardStore();
const inspirations = useInspirationStore();
const errors = useErrorStore();

const selectedBoardId = ref<string | undefined>(undefined);
const creating = ref(false);
const message = ref('');
const messageOk = ref(false);
const showDegraded = ref(false);

const selectedBoard = computed(() => (selectedBoardId.value ? boards.getBoard(selectedBoardId.value) : undefined));
const selectedImages = computed<InspirationImage[]>(() =>
  selectedBoard.value ? inspirations.getImages(selectedBoard.value.imageIds) : []
);

const { loading: bootLoading, execute: boot } = useAsyncAction(
  async () => {
    await inspirations.seed();
    await boards.load();
    if (!selectedBoardId.value && boards.boards.length) selectedBoardId.value = boards.boards[0].id;
  },
  { fallbackMessage: '灵感板加载失败，请重试' }
);
const bootstrap = { execute: boot, loading: bootLoading };

function dismissDegraded() {
  showDegraded.value = false;
  boards.storageDegraded = false;
}

function boardImages(boardId: string): InspirationImage[] {
  const board = boards.getBoard(boardId);
  return board ? inspirations.getImages(board.imageIds) : [];
}

function selectBoard(id: string) {
  selectedBoardId.value = id;
}

async function create(prefill?: string) {
  const name = prefill ?? window.prompt('为新灵感板起个名字', `材质实验 ${boards.boards.length + 1}`);
  if (name === null) return;
  if (!name.trim()) {
    messageOk.value = false;
    message.value = '灵感板名称不能为空';
    return;
  }
  creating.value = true;
  try {
    const board = await boards.createBoard(name);
    selectedBoardId.value = board.id;
    messageOk.value = true;
    message.value = `已创建灵感板「${board.name}」，刷新后仍会保留`;
    showDegraded.value = false;
  } catch (caught) {
    showDegraded.value = true;
    errors.notify(toAppError(caught, '新建灵感板写入本地失败，请重试'), {
      retryable: true,
      retry: () => void create(name)
    });
  } finally {
    creating.value = false;
  }
}

async function removeBoard(id: string) {
  const board = boards.getBoard(id);
  if (!board) return;
  if (!window.confirm(`确定删除灵感板「${board.name}」吗？`)) return;
  try {
    await boards.removeBoard(id);
    if (selectedBoardId.value === id) selectedBoardId.value = boards.boards[0]?.id;
    messageOk.value = true;
    message.value = '灵感板已删除';
  } catch (caught) {
    showDegraded.value = true;
    errors.notify(toAppError(caught, '删除灵感板失败，请重试'), { retryable: true, retry: () => removeBoard(id) });
  }
}

let saveTimer: number | undefined;
function persistOrder(ids: string[]) {
  if (!selectedBoardId.value) return;
  const boardId = selectedBoardId.value;
  // 拖拽过程会高频触发事件，做一次轻量防抖后落库。
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    boards
      .reorder(boardId, ids)
      .then(() => {
        messageOk.value = true;
        message.value = '排列顺序已保存';
      })
      .catch((caught) => {
        showDegraded.value = true;
        errors.notify(toAppError(caught, '排列顺序保存失败，请重试'), {
          retryable: true,
          retry: () => void boards.reorder(boardId, ids)
        });
      });
  }, 250);
}

onMounted(() => bootstrap.execute());
</script>
