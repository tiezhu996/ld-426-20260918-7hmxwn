<template>
  <section class="space-y-8">
    <div class="max-w-4xl">
      <p class="text-sm font-semibold uppercase tracking-[0.25em] text-clay">Style quiz</p>
      <h1 class="page-title mt-3">把偏好变成可执行的装修方向</h1>
    </div>
    <ProgressBar :value="progress" />
    <QuizCard v-if="currentQuestion && !completed" :question="currentQuestion" @answer="handleAnswer" />
    <ErrorBoundary v-else-if="profile" name="quiz-result">
      <div class="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div class="bg-paper p-8 ring-1 ring-ink/10">
          <p class="text-sm text-ink/60">主风格</p>
          <h2 class="font-display text-5xl text-ink">{{ profile.primaryStyle }}</h2>
          <p class="mt-2 text-sm font-semibold text-clay">辅风格：{{ profile.secondaryStyle }}</p>
          <p class="mt-4 text-ink/70">{{ styleDescriptions[profile.primaryStyle] }}</p>
          <div class="mt-6 flex flex-wrap gap-3">
            <RouterLink class="inline-block bg-clay px-5 py-3 font-semibold text-paper" to="/gallery">查看匹配图集</RouterLink>
            <button type="button" class="border border-ink/20 px-5 py-3 font-semibold text-ink" @click="restart">重新测试</button>
          </div>
          <p v-if="saveError" class="mt-4 text-xs text-ochre">结果保存遇到本地存储异常，可点击重试保存。</p>
        </div>
        <StyleRadarChart :scores="profile.scores" />
      </div>
    </ErrorBoundary>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { styleDescriptions } from '../constants/styleDescriptions';
import ProgressBar from '../components/common/ProgressBar.vue';
import QuizCard from '../components/common/QuizCard.vue';
import StyleRadarChart from '../components/common/StyleRadarChart.vue';
import ErrorBoundary from '../components/common/ErrorBoundary.vue';
import { useQuiz } from '../hooks/useQuiz';
import { useProfileStore } from '../stores/profileStore';
import { QuizOption } from '../types';

const quiz = useQuiz();
const profileStore = useProfileStore();
const completed = ref(false);
const saveError = ref(false);
const currentQuestion = quiz.currentQuestion;
const progress = computed(() => (completed.value ? 100 : quiz.progress.value));
const profile = computed(() => profileStore.profile);

async function handleAnswer(option: QuizOption) {
  quiz.answer(option);
  if (quiz.answers.value.length === quiz.questions.length) {
    completed.value = true;
    try {
      await profileStore.saveProfile(quiz.result());
      saveError.value = false;
    } catch {
      // 全局提示条会给出「重试」入口；此处保留结果视图并提示状态。
      saveError.value = true;
    }
  }
}

function restart() {
  completed.value = false;
  saveError.value = false;
  quiz.reset();
}
</script>
