import { ref, watch } from 'vue';
import { useErrorStore } from '../stores/errorStore';

function readValue<T>(key: string, initialValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return initialValue;
    return JSON.parse(stored) as T;
  } catch {
    // 数据被外部写坏时回退初始值，并通过提示条告知可恢复状态。
    useErrorStore().notify(
      { kind: 'storage', message: `本地设置「${key}」已损坏，已恢复为默认值。` },
      { retryable: false }
    );
    return initialValue;
  }
}

/**
 * 通用本地存储 hook：读取 / 写入均做异常隔离，
 * 隐私模式或配额超限时保留内存状态并提示，不抛出阻断渲染。
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const state = ref(initialValue) as ReturnType<typeof ref<T>>;
  state.value = readValue(key, initialValue);

  watch(
    state,
    (value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        useErrorStore().notify(
          { kind: 'storage', message: '本地存储不可用，本次设置仅在当前页面有效。' },
          {
            retryable: true,
            retry: () => {
              try {
                localStorage.setItem(key, JSON.stringify(value));
              } catch {
                /* 用户可再次点击重试 */
              }
            }
          }
        );
      }
    },
    { deep: true }
  );

  return state;
}
