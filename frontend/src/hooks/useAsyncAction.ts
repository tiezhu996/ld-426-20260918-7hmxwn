import { ref } from 'vue';
import { useErrorStore } from '../stores/errorStore';
import { toAppError } from '../types';

/**
 * 封装一次需要本地存储参与的异步操作：
 * - 维护 loading 状态，空数据时页面仍可渲染空状态；
 * - 失败时展示「可恢复」提示，并把重试动作（重新执行同一操作）交给提示条；
 * - 成功时自动清除同一提示。
 */
export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options: { fallbackMessage?: string } = {}
) {
  const errors = useErrorStore();
  const loading = ref(false);
  const error = ref<ReturnType<typeof toAppError> | null>(null);
  const noticeId = ref<number | null>(null);
  const lastArgs = ref<TArgs | null>(null);

  async function run(...args: TArgs): Promise<TResult | undefined> {
    loading.value = true;
    error.value = null;
    try {
      const result = await action(...args);
      if (noticeId.value !== null) {
        errors.dismiss(noticeId.value);
        noticeId.value = null;
      }
      return result;
    } catch (caught) {
      const appError = toAppError(caught, options.fallbackMessage);
      error.value = appError;
      if (noticeId.value === null) {
        noticeId.value = errors.notify(appError, {
          retryable: true,
          retry: () => {
            if (lastArgs.value) void run(...lastArgs.value);
          }
        });
      }
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  /** 首次执行（记录参数，供提示条上的「重试」复用）。 */
  function execute(...args: TArgs) {
    lastArgs.value = args;
    return run(...args);
  }

  function retry() {
    if (lastArgs.value) return run(...lastArgs.value);
    return Promise.resolve(undefined);
  }

  return { loading, error, execute, retry };
}
