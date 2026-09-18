import { defineStore } from 'pinia';
import { StyleProfile } from '../types';
import { db } from '../utils/db';
import { withStorage } from '../utils/storage';

const LOCAL_USER_ID = 'local-user';

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: undefined as StyleProfile | undefined,
    history: [] as StyleProfile[],
    loaded: false
  }),
  actions: {
    /** 保存一次测试结果（主辅风格 + 各风格得分），并刷新历史列表 */
    async saveProfile(profile: StyleProfile) {
      await withStorage('保存风格档案', () => db.profiles.put({ ...profile, userId: LOCAL_USER_ID }));
      await this.loadProfile();
    },
    /** 从 IndexedDB 读回历史测试结果，最近一次作为当前档案；空数据时保持 undefined */
    async loadProfile() {
      const profiles = await withStorage('读取风格档案', () =>
        db.profiles.where('userId').equals(LOCAL_USER_ID).sortBy('testedAt')
      );
      this.history = profiles.reverse();
      this.profile = this.history[0];
      this.loaded = true;
    }
  }
});
