import { toRaw } from 'vue';

/**
 * 把 Pinia / Vue 的响应式代理对象转成可被 IndexedDB 结构化克隆的普通对象。
 * 直接对 reactive proxy 调用 IDB put 会抛 DataCloneError，
 * 因此所有「读取自 store 再写回」的记录都必须先经此函数脱壳。
 */
export function toPlain<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => toPlain(item)) as unknown as T;
  const raw = toRaw(value) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(raw)) {
    out[key] = toPlain((raw as Record<string, unknown>)[key]);
  }
  return out as T;
}
