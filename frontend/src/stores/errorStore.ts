import { defineStore } from 'pinia';
import { AppError } from '../types';

export interface ErrorNotice extends AppError {
  id: number;
  /** 是否处于可恢复（重试）状态 */
  retryable: boolean;
  retry?: () => void;
}

let seq = 0;

export const useErrorStore = defineStore('error', {
  state: () => ({ notices: [] as ErrorNotice[] }),
  actions: {
    notify(error: AppError, options: { retryable?: boolean; retry?: () => void } = {}) {
      const id = ++seq;
      this.notices.push({
        id,
        kind: error.kind,
        message: error.message,
        cause: error.cause,
        retryable: options.retryable ?? true,
        retry: options.retry
      });
      // 无重试动作的提示自动消失，可恢复的提示保留直到用户处理。
      if (!options.retry) {
        window.setTimeout(() => this.dismiss(id), 5000);
      }
      return id;
    },
    dismiss(id: number) {
      this.notices = this.notices.filter((notice) => notice.id !== id);
    },
    clear() {
      this.notices = [];
    }
  }
});
