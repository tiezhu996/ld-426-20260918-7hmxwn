export type ErrorSource = 'storage' | 'image' | 'render' | 'unknown';

/** 本地存储（IndexedDB / localStorage）异常的统一类型 */
export class StorageError extends Error {
  readonly source: ErrorSource = 'storage';
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'StorageError';
    this.cause = cause;
  }
}

export function describeError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}
