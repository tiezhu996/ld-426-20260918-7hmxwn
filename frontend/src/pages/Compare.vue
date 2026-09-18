<template>
  <section class="space-y-7">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.25em] text-clay">Compare</p>
      <h1 class="page-title mt-3">并排看见方案差异</h1>
    </div>

    <StorageNotice v-if="store.storageDegraded" text="本地存储不可用，方案来自缓存，可在恢复后重试连接。" @retry="bootstrap.execute()" @dismiss="store.storageDegraded = false" />

    <!-- 仅允许从「真实存在的灵感板」生成对比方案 -->
    <div class="flex flex-col gap-3 bg-paper p-4 ring-1 ring-ink/10 md:flex-row md:items-end">
      <div class="md:w-72">
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-semibold uppercase tracking-widest text-ink/50">选择灵感板加入对比</span>
          <select v-model="newBoardId" class="border border-ink/20 bg-paper px-3 py-2 text-sm text-ink focus:border-clay focus:outline-none">
            <option value="" disabled>{{ boards.hasBoards ? '选择一个灵感板' : '暂无灵感板' }}</option>
            <option v-for="board in availableBoards" :key="board.id" :value="board.id">{{ board.name }}（{{ board.imageIds.length }} 张）</option>
          </select>
        </label>
      </div>
      <button
        type="button"
        class="bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-clay disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!newBoardId"
        @click="addPlan"
      >
        生成对比方案
      </button>
      <button
        type="button"
        class="border border-ink/20 px-4 py-2.5 text-sm text-ink hover:border-clay"
        :disabled="!store.validPlans.length"
        @click="resync"
      >
        重新同步标签与颜色
      </button>
      <p v-if="!boards.hasBoards" class="text-xs text-ink/60">
        还没有灵感板，<RouterLink class="font-semibold text-clay hover:underline" to="/moodboards">先去创建并收藏图片</RouterLink>。
      </p>
      <p v-else-if="!availableBoards.length" class="text-xs text-ink/60">所有灵感板都已加入对比。</p>
    </div>

    <EmptyState v-if="!store.validPlans.length && !bootLoading" text="还没有对比方案，从上方选择一个真实灵感板开始" />

    <div class="grid gap-5 lg:grid-cols-2">
      <ErrorBoundary v-for="plan in store.validPlans" :key="plan.id" :name="`compare-${plan.id}`">
        <ComparisonPanel :plan="plan" :board="boardOf(plan)" @remove="removePlan" />
      </ErrorBoundary>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ComparisonPanel from '../components/common/ComparisonPanel.vue';
import EmptyState from '../components/common/EmptyState.vue';
import ErrorBoundary from '../components/common/ErrorBoundary.vue';
import StorageNotice from '../components/common/StorageNotice.vue';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useComparisonStore } from '../stores/comparisonStore';
import { useErrorStore } from '../stores/errorStore';
import { useInspirationStore } from '../stores/inspirationStore';
import { useMoodboardStore } from '../stores/moodboardStore';
import { ComparisonPlan, MoodBoard, toAppError } from '../types';

const store = useComparisonStore();
const boards = useMoodboardStore();
const inspirations = useInspirationStore();
const errors = useErrorStore();
const newBoardId = ref('');

const { loading: bootLoading, execute: boot } = useAsyncAction(
  async () => {
    // 顺序保证：先有图集与真实灵感板，方案的标签/颜色才能正确派生。
    await inspirations.seed();
    await boards.load();
    await store.load();
  },
  { fallbackMessage: '对比数据加载失败，请重试' }
);
const bootstrap = { execute: boot, loading: bootLoading };

/** 可加入对比的灵感板 = 真实存在且尚未被方案引用。 */
const availableBoards = computed(() => boards.boards.filter((board) => !store.plans.some((plan) => plan.moodBoardId === board.id)));

function boardOf(plan: ComparisonPlan): MoodBoard | undefined {
  return boards.getBoard(plan.moodBoardId);
}

async function addPlan() {
  if (!newBoardId.value) return;
  const board = boards.getBoard(newBoardId.value);
  if (!board) return;
  try {
    await store.createPlan(board.name, board.id);
    newBoardId.value = '';
  } catch (caught) {
    errors.notify(toAppError(caught, '生成对比方案失败，请重试'), {
      retryable: true,
      retry: () => addPlan()
    });
  }
}

async function removePlan(id: string) {
  try {
    await store.removePlan(id);
  } catch (caught) {
    errors.notify(toAppError(caught, '移除方案失败，请重试'), { retryable: true, retry: () => removePlan(id) });
  }
}

async function resync() {
  await Promise.all(
    store.validPlans.map((plan) =>
      store.syncPlan(plan.id).catch((caught) =>
        errors.notify(toAppError(caught, '同步标签失败，请重试'), { retryable: true, retry: () => store.syncPlan(plan.id) })
      )
    )
  );
}

onMounted(() => bootstrap.execute());
</script>
