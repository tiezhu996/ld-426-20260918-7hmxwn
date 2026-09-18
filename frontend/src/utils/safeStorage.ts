import { StorageError } from '../types';

/** 本地存储备份键，IndexedDB 不可用时作为降级读回来源。 */
export const STORAGE_KEYS = {
  profile: 'decor-at-atelier:profile',
  moodboards: 'decor-at-atelier:moodboards',
  comparisons: 'decor-at-atelier:comparisons'
} as const;

/**
 * 包裹一次 IndexedDB 操作，把底层异常统一转换为 StorageError，
 * 避免 Dexie / 浏览器隐私模式错误直接冒泡导致页面卡死。
 */
export async function withStorage<T>(label: string, op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (cause) {
    throw new StorageError(`${label}失败，本地存储可能不可用，请重试`, cause);
  }
}

export function readLocalBackup<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function writeLocalBackup(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeLocalBackup(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* 忽略：隐私模式等场景下本地存储本就不可写 */
  }
}
