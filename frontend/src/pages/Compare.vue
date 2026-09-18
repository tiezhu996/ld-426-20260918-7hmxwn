<template>
  <section class="space-y-7">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.25em] text-clay">Compare</p>
        <h1 class="page-title mt-3">并排看见方案差异</h1>
      </div>
    </div>

    <ErrorBanner v-if="loadError" :message="loadError" retryable @retry="init" @dismiss="loadError = ''" />
    <ErrorBanner v-if="actionError" :message="actionError" dismissible @dismiss="actionError = ''" />

    <div v-if="!loadError" class="grid gap-4 bg-paper p-4 ring-1 ring-ink/10 lg:grid-cols-[auto_1fr_auto] lg:items-center">
      <p class="text-sm font-semibold text-ink/70">把真实灵感板加入对比</p>
      <select
        v-if="addableBoards.length"
        v-model="pendingBoardId"
        class="min-w-0 border border-ink/20 bg-paper px-3 py-2 text-ink focus:border-clay focus:outline-none"
      >
        <option value="" disabled>请选择已有灵感板</option>
        <option v-for="board in addableBoards" :key="board.id" :value="board.id">
          {{ board.name }}（{{ board.imageIds.length }} 张）
        </option>
      </select>
      <p v-else class="text-sm text-ink/50">所有灵感板都已加入对比</p>
      <button
        type="button"
        class="bg-ink px-5 py-2 text-sm font-semibold text-paper transition hover:bg-clay disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!pendingBoardId"
        @click="addPlan"
      >
        加入对比
      </button>
    </div>

    <div v-if="comparison.plans.length" class="grid gap-5 lg:grid-cols-2">
      <ComparisonPanel
        v-for="plan in comparison.plans"
        :key="plan.id"
        :plan="plan"
        :board="boardOf(plan.moodBoardId)"
        :images="imagesOf(plan.moodBoardId)"
        @remove="removePlan"
      />
    </div>
    <EmptyState v-else-if="!loadError" text="还没有可对比的方案：先创建灵感板并收藏图片，再把它加入对比">
      <RouterLink to="/moodboards" class="border border-ink/30 px-4 py-2 text-sm hover:bg-ink hover:text-paper">去管理灵感板</RouterLink>
    </EmptyState>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ComparisonPanel from '../components/common/ComparisonPanel.vue';
import EmptyState from '../components/common/EmptyState.vue';
import ErrorBanner from '../components/common/ErrorBanner.vue';
import { useComparisonStore } from '../stores/comparisonStore';
import { useInspirationStore } from '../stores/inspirationStore';
import { useMoodboardStore } from '../stores/moodboardStore';
import { describeError, InspirationImage, MoodBoard } from '../types';
import { resetDbConnection } from '../utils/db';

const comparison = useComparisonStore();
const boards = useMoodboardStore();
const inspirations = useInspirationStore();

const loadError = ref('');
const actionError = ref('');
const pendingBoardId = ref('');

const addableBoards = computed(() =>
  boards.boards.filter((board) => !comparison.plans.some((plan) => plan.moodBoardId === board.id))
);

function boardOf(boardId: string): MoodBoard | undefined {
  return boards.boards.find((board) => board.id === boardId);
}

function imagesOf(boardId: string): InspirationImage[] {
  const board = boardOf(boardId);
  if (!board) return [];
  return board.imageIds.map((id) => inspirations.imageMap.get(id)).filter(Boolean) as InspirationImage[];
}

async function addPlan() {
  actionError.value = '';
  const boardId = pendingBoardId.value;
  if (!boardId) return;
  try {
    await comparison.addPlan(boardId);
    pendingBoardId.value = '';
  } catch (error) {
    actionError.value = describeError(error, '加入对比失败，请重试');
  }
}

async function removePlan(planId: string) {
  actionError.value = '';
  try {
    await comparison.removePlan(planId);
  } catch (error) {
    actionError.value = describeError(error, '移出对比失败，请重试');
  }
}

async function init() {
  loadError.value = '';
  resetDbConnection();
  try {
    await inspirations.seed();
    await boards.load();
    await comparison.load();
  } catch (error) {
    loadError.value = describeError(error, '本地数据读取失败，请点击重试');
  }
}

onMounted(init);
</script>
