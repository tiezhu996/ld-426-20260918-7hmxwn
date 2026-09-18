import { ref, watch } from 'vue';
import { readStorage, writeStorage } from '../utils/storage';

/**
 * 通用本地存储 hook。
 * - 读取时 JSON 损坏 / 存储被禁用：静默回退到 initialValue，不抛错；
 * - 写入失败：暴露 storageError，调用方可给出可恢复提示，页面状态仍保留在内存中。
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const state = ref<T>(readStorage<T>(key, initialValue));
  const storageError = ref<string | undefined>(undefined);

  watch(
    state,
    (value) => {
      try {
        writeStorage(key, value);
        storageError.value = undefined;
      } catch (error) {
        storageError.value = error instanceof Error ? error.message : '本地存储不可用';
      }
    },
    { deep: true }
  );

  return { state, storageError };
}
