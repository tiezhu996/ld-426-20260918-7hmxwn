/**
 * 统一的错误分类，便于 UI 层判断是否可重试 / 是否为本地存储问题。
 */
export type AppErrorKind = 'storage' | 'image' | 'unknown';

export interface AppError {
  kind: AppErrorKind;
  message: string;
  cause?: unknown;
}

export class AppErrorBase extends Error {
  kind: AppErrorKind;
  declare cause?: unknown;

  constructor(kind: AppErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.cause = cause;
  }
}

/** 本地存储（IndexedDB / localStorage）不可用或读写失败。 */
export class StorageError extends AppErrorBase {
  constructor(message: string, cause?: unknown) {
    super('storage', message, cause);
    this.name = 'StorageError';
  }
}

/** 图片资源加载失败。 */
export class ImageLoadError extends AppErrorBase {
  constructor(message: string, cause?: unknown) {
    super('image', message, cause);
    this.name = 'ImageLoadError';
  }
}

export function isStorageError(error: unknown): error is StorageError {
  return !!error && typeof error === 'object' && (error as { kind?: string }).kind === 'storage';
}

export function toAppError(error: unknown, fallback = '操作失败，请稍后重试'): AppError {
  if (error instanceof AppErrorBase) return { kind: error.kind, message: error.message, cause: error.cause };
  if (error instanceof Error) return { kind: 'unknown', message: error.message || fallback, cause: error };
  return { kind: 'unknown', message: fallback, cause: error };
}
