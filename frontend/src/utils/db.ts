import Dexie, { Table } from 'dexie';
import { ComparisonPlan, InspirationImage, MoodBoard, StyleProfile } from '../types';

export class DecorDatabase extends Dexie {
  // v2 起物理表名为 profileRecords；profiles 仅作为类属性访问名。
  profiles!: Table<StyleProfile, string>;
  images!: Table<InspirationImage, string>;
  moodboards!: Table<MoodBoard, string>;
  comparisons!: Table<ComparisonPlan, string>;

  constructor() {
    super('decor-style-lab');
    this.version(1).stores({
      profiles: 'userId, primaryStyle, testedAt',
      images: 'id, style, roomType',
      moodboards: 'id, createdAt',
      comparisons: 'id, moodBoardId, createdAt'
    });
    // v2：StyleProfile 改为唯一主键 id（支持同一用户多次测试的历史）。
    // IndexedDB 无法原地修改 objectStore 主键，因此新建 profileRecords 表，
    // 在升级事务中把旧 profiles 数据读出、补齐 id 后迁入，并删除旧表。
    this.version(2)
      .stores({
        profiles: null,
        profileRecords: 'id, userId, primaryStyle, testedAt',
        images: 'id, style, roomType',
        moodboards: 'id, createdAt',
        comparisons: 'id, moodBoardId, createdAt'
      })
      .upgrade(async (tx) => {
        const legacy = await tx.table('profiles').toArray();
        for (const profile of legacy) {
          await tx.table('profileRecords').put({
            ...profile,
            id: profile.id ?? crypto.randomUUID()
          });
        }
      });

    // 把类属性 profiles 指向新物理表，业务层无需改名。
    this.profiles = this.table('profileRecords');
  }
}

export const db = new DecorDatabase();
