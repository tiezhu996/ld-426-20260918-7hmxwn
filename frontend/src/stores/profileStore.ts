import { defineStore } from 'pinia';
import { StyleProfile } from '../types';
import { db } from '../utils/db';
import { readLocalBackup, removeLocalBackup, STORAGE_KEYS, withStorage, writeLocalBackup } from '../utils/safeStorage';
import { toPlain } from '../utils/toPlain';

const USER_ID = 'local-user';

/** 按测试时间倒序排列档案。 */
function sortByTestedAtDesc(profiles: StyleProfile[]): StyleProfile[] {
  return [...profiles].sort((a, b) => (a.testedAt < b.testedAt ? 1 : a.testedAt > b.testedAt ? -1 : 0));
}

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: undefined as StyleProfile | undefined,
    history: [] as StyleProfile[],
    storageDegraded: false
  }),
  getters: {
    hasProfile: (state) => !!state.profile?.completed
  },
  actions: {
    /** 保存测试结果（主辅风格 + 得分），每次测试都是独立历史记录。 */
    async saveProfile(profile: StyleProfile) {
      const record: StyleProfile = toPlain({ ...profile, userId: USER_ID });
      await withStorage('保存风格档案', async () => {
        try {
          await db.profiles.put(record);
          this.storageDegraded = false;
        } catch (cause) {
          // IndexedDB 不可用时降级到 localStorage，仍保证刷新可读回。
          this.storageDegraded = true;
          const historyBackup = sortByTestedAtDesc([...this.readBackupHistory().filter((item) => item.id !== record.id), record]);
          if (!writeLocalBackup(STORAGE_KEYS.profile, historyBackup)) throw cause;
        }
      });
      this.profile = record;
      await this.refreshHistory();
    },
    readBackupHistory(): StyleProfile[] {
      const raw = readLocalBackup<StyleProfile | StyleProfile[]>(STORAGE_KEYS.profile);
      if (!raw) return [];
      // 兼容旧版本：备份可能是单对象而非数组。
      return Array.isArray(raw) ? raw : [raw];
    },
    async refreshHistory() {
      await withStorage('读取测试历史', async () => {
        try {
          this.history = sortByTestedAtDesc(await db.profiles.where('userId').equals(USER_ID).toArray());
          this.storageDegraded = false;
          writeLocalBackup(STORAGE_KEYS.profile, this.history);
        } catch {
          this.storageDegraded = true;
          this.history = sortByTestedAtDesc(this.readBackupHistory());
        }
      });
    },
    /** 刷新页面后读回最近一次档案；无数据时保持空，不抛错。 */
    async loadProfile() {
      await withStorage('读取风格档案', async () => {
        try {
          this.history = sortByTestedAtDesc(await db.profiles.where('userId').equals(USER_ID).toArray());
          this.storageDegraded = false;
          writeLocalBackup(STORAGE_KEYS.profile, this.history);
        } catch {
          this.storageDegraded = true;
          this.history = sortByTestedAtDesc(this.readBackupHistory());
        }
        this.profile = this.history[0];
      });
    },
    async clearProfile() {
      await withStorage('清除风格档案', async () => {
        await db.profiles.where('userId').equals(USER_ID).delete();
        removeLocalBackup(STORAGE_KEYS.profile);
        this.profile = undefined;
        this.history = [];
      });
    }
  }
});
