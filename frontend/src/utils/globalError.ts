import { StorageError } from '../types';

let toast: HTMLDivElement | null = null;

function showToast(message: string) {
  if (typeof document === 'undefined') return;
  if (!toast) {
    toast = document.createElement('div');
    toast.setAttribute('role', 'alert');
    toast.style.cssText =
      'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;max-width:90vw;' +
      'background:#b86f52;color:#f6f1e8;padding:12px 18px;font-size:13px;border-radius:2px;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.18);display:flex;gap:12px;align-items:center';
    document.body.appendChild(toast);
  }
  toast.innerHTML = '';
  const text = document.createElement('span');
  text.textContent = message;
  const close = document.createElement('button');
  close.textContent = '知道了';
  close.style.cssText = 'border:1px solid #f6f1e8;background:transparent;color:#f6f1e8;padding:2px 10px;cursor:pointer';
  close.addEventListener('click', () => toast?.remove(), { once: true });
  toast.append(text, close);
}

/** 注册全局未捕获异常提示：图片/存储异常即便漏接，用户也能看到可恢复提示而不是白屏 */
export function registerGlobalErrorHandler() {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof StorageError || /storage|indexeddb|database/i.test(String(event.reason?.message ?? ''))) {
      event.preventDefault();
      showToast(event.reason?.message ?? '本地存储异常，请重试或检查浏览器存储权限');
    }
  });
  window.addEventListener('error', (event) => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'IMG' || target.tagName === 'SOURCE')) {
      // 图片加载失败由各组件内的 @error 兜底显示占位图，这里不重复打扰
      return;
    }
  });
}
