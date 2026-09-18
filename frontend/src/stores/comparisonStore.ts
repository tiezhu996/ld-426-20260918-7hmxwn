import { defineStore } from 'pinia';
import { ComparisonPlan, DecorStyle } from '../types';
import { db } from '../utils/db';
import { deriveBoardStyles, stylesToColors } from '../utils/boardMeta';
import { withStorage } from '../utils/storage';

export const useComparisonStore = defineStore('comparison', {
  state: () => ({
    plans: [] as ComparisonPlan[],
    loaded: false
  }),
  actions: {
    /**
     * 读取对比方案，只保留仍真实存在的灵感板；
     * 风格标签与颜色始终从灵感板当前包含的图片重新推导并回写。
     */
    async load() {
      const [storedPlans, boards, images] = await Promise.all([
        withStorage('读取对比方案', () => db.comparisons.orderBy('createdAt').toArray()),
        withStorage('读取灵感板', () => db.moodboards.toArray()),
        withStorage('读取灵感图片', () => db.images.toArray())
      ]);
      const boardMap = new Map(boards.map((board) => [board.id, board]));
      const synced: ComparisonPlan[] = [];
      const staleIds: string[] = [];

      for (const plan of storedPlans) {
        const board = boardMap.get(plan.moodBoardId);
        if (!board) {
          staleIds.push(plan.id);
          continue;
        }
        const boardImages = board.imageIds.map((id) => images.find((image) => image.id === id)).filter(Boolean) as typeof images;
        const styleTags = deriveBoardStyles(boardImages);
        const colors = stylesToColors(styleTags);
        const next = { ...plan, name: board.name, styleTags, colors };
        const changed =
          next.name !== plan.name ||
          next.styleTags.join('|') !== plan.styleTags.join('|') ||
          next.colors.join('|') !== plan.colors.join('|');
        if (changed) await withStorage('同步方案风格', () => db.comparisons.put(next));
        synced.push(next);
      }
      if (staleIds.length) {
        await withStorage('清理失效方案', () => db.comparisons.bulkDelete(staleIds));
      }
      this.plans = synced;
      this.loaded = true;
    },
    /** 基于一个真实存在的灵感板创建对比方案；重复加入同一灵感板会被忽略 */
    async addPlan(moodBoardId: string): Promise<ComparisonPlan | undefined> {
      const board = await withStorage('读取灵感板', () => db.moodboards.get(moodBoardId));
      if (!board) throw new Error('灵感板不存在，无法加入对比');
      if (this.plans.some((plan) => plan.moodBoardId === moodBoardId)) return undefined;
      const images = await withStorage('读取灵感图片', () => db.images.toArray());
      const boardImages = board.imageIds
        .map((id) => images.find((image) => image.id === id))
        .filter(Boolean) as typeof images;
      const styleTags: DecorStyle[] = deriveBoardStyles(boardImages);
      const plan: ComparisonPlan = {
        id: crypto.randomUUID(),
        name: board.name,
        moodBoardId: board.id,
        styleTags,
        colors: stylesToColors(styleTags),
        createdAt: new Date().toISOString()
      };
      await withStorage('创建对比方案', () => db.comparisons.put(plan));
      this.plans = [...this.plans, plan];
      return plan;
    },
    async removePlan(planId: string) {
      await withStorage('删除对比方案', () => db.comparisons.delete(planId));
      this.plans = this.plans.filter((plan) => plan.id !== planId);
    }
  }
});
