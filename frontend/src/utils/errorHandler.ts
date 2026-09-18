import { App } from 'vue';
import { useErrorStore } from '../stores/errorStore';
import { toAppError } from '../types';

/**
 * 注册 Vue 全局错误处理与资源加载错误兜底。
 * 渲染期错误由 <ErrorBoundary> 就近处理；未被边界捕获的错误进入全局提示条，
 * 保证本地存储或图片异常不会让整个应用白屏卡死。
 */
export function registerGlobalErrorHandler(app: App): void {
  app.config.errorHandler = (error, _instance, info) => {
    const appError = toAppError(error, `界面渲染异常（${info}）`);
    // 全局错误不可自动重试，仅提示用户刷新恢复。
    useErrorStore().notify(appError, { retryable: false });
    // eslint-disable-next-line no-console
    console.error('[DecorAtelier]', error, info);
  };

  window.addEventListener(
    'error',
    (event) => {
      // 普通 <img> 加载失败由 SafeImage 自行处理；这里只兜底脚本等资源错误。
      const target = event.target as HTMLElement | null;
      if (target && target.tagName !== 'IMG') {
        useErrorStore().notify(toAppError(event.error ?? new Error(event.message), '资源加载失败'), { retryable: false });
      }
    },
    true
  );

  window.addEventListener('unhandledrejection', (event) => {
    useErrorStore().notify(toAppError(event.reason, '存在未处理的异步异常'), { retryable: false });
  });
}
