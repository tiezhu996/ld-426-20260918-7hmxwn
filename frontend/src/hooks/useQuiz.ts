import { computed, ref } from 'vue';
import { mockQuiz } from '../api/mockQuiz';
import { QuizOption } from '../types';
import { calculateStyleProfile } from '../utils/styleCalculator';

const DEFAULT_USER_ID = 'local-user';

export function useQuiz() {
  const currentIndex = ref(0);
  const answers = ref<QuizOption[]>([]);
  const currentQuestion = computed(() => mockQuiz[currentIndex.value]);
  const progress = computed(() => Math.round((Math.min(answers.value.length, mockQuiz.length) / mockQuiz.length) * 100));
  const allAnswered = computed(() => answers.value.filter(Boolean).length === mockQuiz.length);

  function answer(option: QuizOption) {
    answers.value[currentIndex.value] = option;
    if (currentIndex.value < mockQuiz.length - 1) currentIndex.value += 1;
  }

  function result() {
    return calculateStyleProfile(DEFAULT_USER_ID, answers.value.filter(Boolean));
  }

  function reset() {
    currentIndex.value = 0;
    answers.value = [];
  }

  return { questions: mockQuiz, currentQuestion, currentIndex, answers, progress, allAnswered, answer, result, reset };
}
