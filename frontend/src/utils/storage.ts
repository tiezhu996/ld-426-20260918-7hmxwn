import { StorageError } from '../types';
import { markOpenFailed } from './db';

/**
 * localStorage 安全读取：缺失 / JSON 损坏 / 隐私模式下读写被拒时
 * 不抛出异常，返回 fallback，保证空数据或存储异常都不会卡死页面。
 */
export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** localStorage 安全写入；写入失败（配额 / 被禁用）时抛 StorageError 供上层提示 */
export function writeStorage(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    throw new StorageError('本地存储写入失败，可能是浏览器隐私模式或存储空间不足', error);
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* 移除失败无需阻断流程 */
  }
}

const OPEN_FAILURE_PATTERN = /open|opening|InvalidStateError|SecurityError|DatabaseError|Failed to execute/i;

/** 包裹一次 Dexie 操作，把底层异常统一转成可展示的 StorageError */
export async function withStorage<T>(label: string, task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (OPEN_FAILURE_PATTERN.test(message)) {
      markOpenFailed();
    }
    throw new StorageError(`${label}失败：${message || '本地数据库异常'}`, error);
  }
}
