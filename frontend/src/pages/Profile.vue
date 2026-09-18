<template>
  <section class="space-y-7">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.25em] text-clay">Profile</p>
      <h1 class="page-title mt-3">个人风格档案</h1>
    </div>

    <p v-if="profile.storageDegraded" class="border border-ochre/40 bg-ochre/10 px-4 py-2 text-xs text-ink/70">
      IndexedDB 当前不可用，档案来自本地备份，功能可继续使用。
    </p>

    <ErrorBoundary name="profile-result">
      <div v-if="profile.hasProfile && profile.profile" class="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div class="bg-paper p-8 ring-1 ring-ink/10">
          <p class="text-sm text-ink/60">最近测试 · {{ formatDate(profile.profile.testedAt) }}</p>
          <h2 class="font-display text-5xl text-ink">{{ profile.profile.primaryStyle }}</h2>
          <p class="mt-2 text-sm font-semibold text-clay">辅风格：{{ profile.profile.secondaryStyle }}</p>
          <p class="mt-4 text-ink/70">{{ styleDescriptions[profile.profile.primaryStyle] }}</p>
          <div class="mt-6 flex flex-wrap gap-3">
            <RouterLink class="inline-block bg-clay px-5 py-3 font-semibold text-paper" to="/quiz">重新测试</RouterLink>
            <RouterLink class="inline-block border border-ink/20 px-5 py-3 font-semibold text-ink" to="/gallery">查看匹配图集</RouterLink>
          </div>
        </div>
        <StyleRadarChart :scores="profile.profile.scores" />
      </div>
      <EmptyState v-else text="完成一次风格测试后，这里会出现你的长期偏好档案" />
    </ErrorBoundary>

    <div v-if="profile.history.length > 1" class="bg-paper p-6 ring-1 ring-ink/10">
      <h3 class="font-display text-2xl text-ink">历史测试</h3>
      <ul class="mt-3 divide-y divide-ink/10 text-sm">
        <li v-for="(item, index) in profile.history" :key="`${item.testedAt}-${index}`" class="flex items-center justify-between py-2">
          <span class="text-ink/70">{{ formatDate(item.testedAt) }}</span>
          <span class="font-semibold text-ink">{{ item.primaryStyle }} / {{ item.secondaryStyle }}</span>
        </li>
      </ul>
    </div>

    <div>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-display text-2xl text-ink">我收藏的灵感板</h3>
        <RouterLink class="text-sm font-semibold text-clay hover:underline" to="/moodboards">管理灵感板 →</RouterLink>
      </div>
      <div v-if="boards.hasBoards" class="grid gap-4 lg:grid-cols-3">
        <MoodBoardCard v-for="board in boards.boards" :key="board.id" :board="board" :images="inspirations.getImages(board.imageIds)" @select="goBoard" />
      </div>
      <EmptyState v-else text="还没有灵感板，去图集收藏第一张灵感图吧" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import EmptyState from '../components/common/EmptyState.vue';
import ErrorBoundary from '../components/common/ErrorBoundary.vue';
import MoodBoardCard from '../components/common/MoodBoardCard.vue';
import StyleRadarChart from '../components/common/StyleRadarChart.vue';
import { styleDescriptions } from '../constants/styleDescriptions';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useInspirationStore } from '../stores/inspirationStore';
import { useMoodboardStore } from '../stores/moodboardStore';
import { useProfileStore } from '../stores/profileStore';

const profile = useProfileStore();
const boards = useMoodboardStore();
const inspirations = useInspirationStore();
const router = useRouter();

const bootstrap = useAsyncAction(
  async () => {
    await profile.loadProfile();
    await inspirations.seed();
    await boards.load();
  },
  { fallbackMessage: '个人档案加载失败，请重试' }
);

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function goBoard() {
  void router.push('/moodboards');
}

onMounted(() => bootstrap.execute());
</script>
