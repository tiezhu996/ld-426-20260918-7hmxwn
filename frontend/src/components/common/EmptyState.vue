<template>
  <div class="border border-dashed border-ink/20 bg-paper/70 p-8 text-center text-ink/60">
    <p>{{ text }}</p>
    <div v-if="$slots.default" class="mt-4 flex justify-center">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text?: string }>();
</script>
