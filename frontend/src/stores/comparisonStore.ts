import { defineStore } from 'pinia';
import { ComparisonPlan } from '../types';
import { db } from '../utils/db';
import { readLocalBackup, removeLocalBackup, STORAGE_KEYS, withStorage, writeLocalBackup } from '../utils/safeStorage';
import { toPlain } from '../utils/toPlain';
import { useInspirationStore } from './inspirationStore';
import { useMoodboardStore } from './moodboardStore';
import { syncPlanFromBoard } from '../utils/comparisonSync';

export const useComparisonStore = defineStore('comparison', {
  state: () => ({
    plans: [] as ComparisonPlan[],
    storageDegraded: false
  }),
  getters: {
    /**
     * 只返回「灵感板真实存在」的方案；
     * 灵感板被删除后的悬挂方案不参与对比展示。
     */
    validPlans(state): ComparisonPlan[] {
      const moodboardStore = useMoodboardStore();
      return state.plans.filter((plan) => moodboardStore.boardMap.has(plan.moodBoardId));
    }
  },
  actions: {
    async load() {
      await withStorage('读取对比方案', async () => {
        try {
          const records = await db.comparisons.orderBy('createdAt').reverse().toArray();
          this.plans = records;
          this.storageDegraded = false;
          writeLocalBackup(STORAGE_KEYS.comparisons, records);
        } catch {
          this.storageDegraded = true;
          this.plans = readLocalBackup<ComparisonPlan[]>(STORAGE_KEYS.comparisons) ?? [];
        }
        // 每次读入后按灵感板内真实图片刷新风格标签与颜色。
        await this.syncAll();
      });
    },
    /** 基于真实灵感板创建方案；不存在的灵感板拒绝创建。 */
    async createPlan(name: string, moodBoardId: string): Promise<ComparisonPlan> {
      const moodboardStore = useMoodboardStore();
      const board = moodboardStore.getBoard(moodBoardId);
      if (!board) throw new Error('请选择一个已存在的灵感板');
      const inspirationStore = useInspirationStore();

      const { styleTags, colors } = syncPlanFromBoard(board, inspirationStore.getImages(board.imageIds));
      const plan: ComparisonPlan = {
        id: crypto.randomUUID(),
        name: name.trim() || board.name,
        moodBoardId,
        styleTags,
        colors,
        createdAt: new Date().toISOString()
      };

      await withStorage('创建对比方案', async () => {
        try {
          await db.comparisons.put(toPlain(plan));
          this.storageDegraded = false;
        } catch (cause) {
          this.storageDegraded = true;
          if (!writeLocalBackup(STORAGE_KEYS.comparisons, [plan, ...this.plans])) throw cause;
        }
      });
      await this.load();
      return plan;
    },
    /** 重新同步单个方案的风格标签与颜色（灵感板收藏变化后调用）。 */
    async syncPlan(planId: string) {
      const plan = this.plans.find((item) => item.id === planId);
      if (!plan) return;
      const moodboardStore = useMoodboardStore();
      const board = moodboardStore.getBoard(plan.moodBoardId);
      if (!board) return;
      const inspirationStore = useInspirationStore();
      const { styleTags, colors } = syncPlanFromBoard(toPlain(board), inspirationStore.getImages(board.imageIds));
      const updated = toPlain({ ...plan, styleTags, colors });
      await withStorage('同步方案标签', async () => {
        try {
          await db.comparisons.put(updated);
        } catch (cause) {
          if (!writeLocalBackup(STORAGE_KEYS.comparisons, this.plans.map((item) => (item.id === plan.id ? updated : item)))) {
            throw cause;
          }
        }
      });
      this.plans = this.plans.map((item) => (item.id === plan.id ? updated : item));
    },
    async syncAll() {
      const moodboardStore = useMoodboardStore();
      const inspirationStore = useInspirationStore();
      const updates: ComparisonPlan[] = [];
      for (const plan of this.plans) {
        const board = moodboardStore.getBoard(plan.moodBoardId);
        if (!board) {
          updates.push(toPlain(plan));
          continue;
        }
        const { styleTags, colors } = syncPlanFromBoard(board, inspirationStore.getImages(board.imageIds));
        updates.push(toPlain({ ...plan, styleTags, colors }));
      }
      const changed = updates.some((plan, index) => {
        const original = this.plans[index];
        return JSON.stringify(plan.styleTags) !== JSON.stringify(original.styleTags) || JSON.stringify(plan.colors) !== JSON.stringify(original.colors);
      });
      if (changed) {
        this.plans = updates;
        try {
          await db.comparisons.bulkPut(toPlain(updates));
        } catch {
          writeLocalBackup(STORAGE_KEYS.comparisons, updates);
        }
      }
    },
    async removePlan(planId: string) {
      await withStorage('删除对比方案', async () => {
        await db.comparisons.delete(planId);
        if (this.plans.length <= 1) removeLocalBackup(STORAGE_KEYS.comparisons);
      });
      await this.load();
    }
  }
});
