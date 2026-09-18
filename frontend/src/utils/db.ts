import Dexie, { Table } from 'dexie';
import { ComparisonPlan, InspirationImage, MoodBoard, StyleProfile } from '../types';

export class DecorDatabase extends Dexie {
  profiles!: Table<StyleProfile, string>;
  images!: Table<InspirationImage, string>;
  moodboards!: Table<MoodBoard, string>;
  comparisons!: Table<ComparisonPlan, string>;

  constructor() {
    super('decor-style-lab');
    this.version(2).stores({
      profiles: 'id, userId, primaryStyle, testedAt',
      images: 'id, style, roomType',
      moodboards: 'id, createdAt',
      comparisons: 'id, moodBoardId, createdAt'
    });
  }
}

export const db = new DecorDatabase();

/**
 * 跟踪数据库是否打开失败。Dexie 在 open 失败（隐私模式 / 存储被禁用）后
 * 会进入 broken 状态，必须先 close 才能再次尝试打开；
 * 但连接正常时绝不能 close，否则会打断 SPA 内已有的活动连接。
 */
let openFailed = false;
db.on('close', () => {
  openFailed = false;
});

/** 供 withStorage 在捕获到打开类异常时标记连接已损坏 */
export function markOpenFailed() {
  openFailed = true;
}

/**
 * 页面初始化 / 用户点击重试时调用：
 * 仅在上一轮打开失败时关闭坏连接，让下一次数据操作重新触发打开。
 */
export function resetDbConnection() {
  if (!openFailed) return;
  openFailed = false;
  try {
    db.close();
  } catch {
    /* 未打开时忽略 */
  }
}
