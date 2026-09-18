<template>
  <form class="grid gap-3 bg-paper p-5 ring-1 ring-ink/10" @submit.prevent="submit">
    <h3 class="font-display text-2xl text-ink">新建灵感板</h3>
    <input
      v-model="name"
      type="text"
      maxlength="30"
      placeholder="灵感板名称，例如：暖色木作"
      class="border border-ink/20 bg-paper px-3 py-2 text-ink focus:border-clay focus:outline-none"
    />
    <textarea
      v-model="description"
      rows="2"
      maxlength="120"
      placeholder="描述这个灵感板想探索的方向"
      class="resize-none border border-ink/20 bg-paper px-3 py-2 text-ink focus:border-clay focus:outline-none"
    />
    <p v-if="error" class="text-xs text-clay">{{ error }}</p>
    <button type="submit" class="bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-clay">
      创建并选中
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{ create: [input: { name: string; description: string }] }>();

const name = ref('');
const description = ref('');
const error = ref('');

function submit() {
  if (!name.value.trim()) {
    error.value = '请先填写灵感板名称';
    return;
  }
  emit('create', { name: name.value.trim(), description: description.value.trim() });
  name.value = '';
  description.value = '';
  error.value = '';
}
</script>
