<template>
  <section class="space-y-7">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.25em] text-clay">Profile</p>
      <h1 class="page-title mt-3">个人风格档案</h1>
    </div>

    <ErrorBanner v-if="loadError" :message="loadError" retryable @retry="init" @dismiss="loadError = ''" />

    <div v-if="profile.profile" class="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div class="space-y-6 bg-paper p-8 ring-1 ring-ink/10">
        <div>
          <p class="text-sm text-ink/60">主风格</p>
          <h2 class="font-display text-5xl text-ink">{{ profile.profile.primaryStyle }}</h2>
          <p class="mt-4 text-ink/70">{{ styleDescriptions[profile.profile.primaryStyle] }}</p>
        </div>
        <div class="border-t border-ink/10 pt-5">
          <p class="text-sm text-ink/60">辅风格</p>
          <p class="mt-1 font-display text-2xl text-clay">{{ profile.profile.secondaryStyle }}</p>
          <p class="mt-2 text-sm text-ink/70">{{ styleDescriptions[profile.profile.secondaryStyle] }}</p>
        </div>
        <p class="text-xs text-ink/40">测试时间：{{ formatTime(profile.profile.testedAt) }}</p>
        <RouterLink class="inline-block bg-clay px-5 py-3 font-semibold text-paper" to="/quiz">重新测试</RouterLink>
      </div>
      <div class="bg-paper p-6 ring-1 ring-ink/10">
        <h3 class="mb-2 font-display text-2xl text-ink">风格得分</h3>
        <StyleRadarChart :scores="profile.profile.scores" />
      </div>
    </div>
    <EmptyState v-else-if="profile.loaded && !loadError" text="完成一次风格测试后，这里会出现你的长期偏好档案">
      <RouterLink to="/quiz" class="bg-ink px-5 py-3 text-sm font-semibold text-paper hover:bg-clay">开始风格测试</RouterLink>
    </EmptyState>

    <div v-if="profile.history.length > 1" class="bg-paper p-6 ring-1 ring-ink/10">
      <h3 class="font-display text-2xl text-ink">历史测试（{{ profile.history.length }}）</h3>
      <ul class="mt-4 grid gap-3">
        <li v-for="item in profile.history" :key="item.id" class="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>
            <strong class="text-ink">{{ item.primaryStyle }}</strong>
            <span class="text-ink/50"> / 辅 {{ item.secondaryStyle }}</span>
          </span>
          <span class="text-xs text-ink/40">{{ formatTime(item.testedAt) }}</span>
        </li>
      </ul>
    </div>

    <div>
      <h3 class="mb-4 font-display text-2xl text-ink">收藏的灵感板（{{ boards.boards.length }}）</h3>
      <div v-if="boards.boards.length" class="grid gap-4 lg:grid-cols-3">
        <MoodBoardCard
          v-for="board in boards.boards"
          :key="board.id"
          :board="board"
          :styles="boardStyles(board.id)"
          @select="goToBoard"
        />
      </div>
      <EmptyState v-else-if="!loadError" text="还没有收藏灵感板，去图集挑几张喜欢的图片吧">
        <RouterLink to="/gallery" class="border border-ink/30 px-4 py-2 text-sm hover:bg-ink hover:text-paper">去灵感图集</RouterLink>
      </EmptyState>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import ErrorBanner from '../components/common/ErrorBanner.vue';
import EmptyState from '../components/common/EmptyState.vue';
import MoodBoardCard from '../components/common/MoodBoardCard.vue';
import StyleRadarChart from '../components/common/StyleRadarChart.vue';
import { styleDescriptions } from '../constants/styleDescriptions';
import { useInspirationStore } from '../stores/inspirationStore';
import { useMoodboardStore } from '../stores/moodboardStore';
import { useProfileStore } from '../stores/profileStore';
import { DecorStyle, describeError, InspirationImage } from '../types';
import { deriveBoardStyles } from '../utils/boardMeta';
import { resetDbConnection } from '../utils/db';

const profile = useProfileStore();
const boards = useMoodboardStore();
const inspirations = useInspirationStore();
const router = useRouter();

const loadError = ref('');

function formatTime(iso: string): string {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? iso : new Date(time).toLocaleString('zh-CN', { hour12: false });
}

function boardStyles(boardId: string): DecorStyle[] {
  const board = boards.boards.find((item) => item.id === boardId);
  if (!board) return [];
  const images = board.imageIds.map((id) => inspirations.imageMap.get(id)).filter(Boolean) as InspirationImage[];
  return deriveBoardStyles(images);
}

function goToBoard(boardId: string) {
  boards.selectBoard(boardId);
  router.push('/moodboards');
}

async function init() {
  loadError.value = '';
  resetDbConnection();
  try {
    await inspirations.seed();
    await profile.loadProfile();
    await boards.load();
  } catch (error) {
    loadError.value = describeError(error, '本地数据读取失败，请点击重试');
  }
}

onMounted(init);
</script>
