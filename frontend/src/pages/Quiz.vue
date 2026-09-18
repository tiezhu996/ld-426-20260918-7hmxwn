<template>
  <section class="space-y-8">
    <div class="max-w-4xl">
      <p class="text-sm font-semibold uppercase tracking-[0.25em] text-clay">Style quiz</p>
      <h1 class="page-title mt-3">把偏好变成可执行的装修方向</h1>
    </div>

    <ErrorBanner v-if="loadError" :message="loadError" retryable @retry="init" @dismiss="loadError = ''" />
    <ErrorBanner v-if="saveError" :message="saveError" retryable @retry="retrySave" @dismiss="saveError = ''" />

    <template v-if="!showResult">
      <ProgressBar :value="progress" />
      <QuizCard v-if="currentQuestion" :question="currentQuestion" @answer="handleAnswer" />
      <EmptyState v-else text="答完三道题，得到你的主辅风格与得分雷达图" />
    </template>

    <div v-else-if="resultProfile" class="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div class="space-y-6 bg-paper p-8 ring-1 ring-ink/10">
        <div>
          <p class="text-sm text-ink/60">主风格</p>
          <h2 class="font-display text-5xl text-ink">{{ resultProfile.primaryStyle }}</h2>
          <p class="mt-4 text-ink/70">{{ styleDescriptions[resultProfile.primaryStyle] }}</p>
        </div>
        <div class="border-t border-ink/10 pt-5">
          <p class="text-sm text-ink/60">辅风格</p>
          <p class="mt-1 font-display text-3xl text-clay">{{ resultProfile.secondaryStyle }}</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <RouterLink class="bg-clay px-5 py-3 font-semibold text-paper" to="/gallery">查看匹配图集</RouterLink>
          <button type="button" class="border border-ink/30 px-5 py-3 font-semibold text-ink hover:bg-ink hover:text-paper" @click="restart">
            重新测试
          </button>
        </div>
      </div>
      <StyleRadarChart :scores="resultProfile.scores" />
    </div>
    <EmptyState v-else text="答完三道题，得到你的主辅风格与得分雷达图" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { styleDescriptions } from '../constants/styleDescriptions';
import EmptyState from '../components/common/EmptyState.vue';
import ErrorBanner from '../components/common/ErrorBanner.vue';
import ProgressBar from '../components/common/ProgressBar.vue';
import QuizCard from '../components/common/QuizCard.vue';
import StyleRadarChart from '../components/common/StyleRadarChart.vue';
import { useQuiz } from '../hooks/useQuiz';
import { useProfileStore } from '../stores/profileStore';
import { describeError, QuizOption, StyleProfile } from '../types';
import { resetDbConnection } from '../utils/db';

const quiz = useQuiz();
const profileStore = useProfileStore();

const showResult = ref(false);
const loadError = ref('');
const saveError = ref('');
const pendingResult = ref<StyleProfile | null>(null);

const currentQuestion = computed(() => (showResult.value ? undefined : quiz.currentQuestion.value));
const progress = computed(() => (showResult.value ? 100 : quiz.progress.value));
const resultProfile = computed(() => pendingResult.value ?? profileStore.profile);

async function handleAnswer(option: QuizOption) {
  quiz.answer(option);
  if (quiz.answers.value.length === quiz.questions.length) {
    const result = quiz.result();
    pendingResult.value = result;
    showResult.value = true;
    await persist(result);
  }
}

async function persist(profile: StyleProfile) {
  saveError.value = '';
  try {
    await profileStore.saveProfile(profile);
  } catch (error) {
    saveError.value = describeError(error, '测试结果保存失败，点击重试，或稍后在个人档案中刷新查看');
  }
}

function retrySave() {
  if (pendingResult.value) void persist(pendingResult.value);
}

function restart() {
  quiz.reset();
  pendingResult.value = null;
  showResult.value = false;
  saveError.value = '';
}

async function init() {
  loadError.value = '';
  resetDbConnection();
  try {
    await profileStore.loadProfile();
    showResult.value = Boolean(profileStore.profile);
  } catch (error) {
    loadError.value = describeError(error, '历史测试结果读取失败，仍可重新完成测试');
  }
}

onMounted(init);
</script>
