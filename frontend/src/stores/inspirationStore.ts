import { defineStore } from 'pinia';
import { mockInspiration } from '../api/mockInspiration';
import { DecorStyle, InspirationImage, RoomType } from '../types';
import { db } from '../utils/db';
import { withStorage } from '../utils/safeStorage';
import { toPlain } from '../utils/toPlain';

export const useInspirationStore = defineStore('inspiration', {
  state: () => ({
    images: [] as InspirationImage[],
    styleFilter: undefined as DecorStyle | undefined,
    roomFilter: undefined as RoomType | undefined,
    /** 内置图集（IndexedDB 不可用时的降级数据源） */
    seedAvailable: true
  }),
  getters: {
    filteredImages(state) {
      return state.images.filter(
        (image) => (!state.styleFilter || image.style === state.styleFilter) && (!state.roomFilter || image.roomType === state.roomFilter)
      );
    },
    imageMap(state) {
      return new Map(state.images.map((image) => [image.id, image]));
    }
  },
  actions: {
    /** 载入内置图集；已有数据不重复写入。存储异常时回退到内存中的 mock 数据。 */
    async seed() {
      await withStorage('载入灵感图集', async () => {
        try {
          const count = await db.images.count();
          if (count === 0) await db.images.bulkPut(mockInspiration);
          this.images = await db.images.toArray();
          this.seedAvailable = true;
        } catch {
          // 隐私模式 / 配额异常：使用内存数据保证页面不空。
          this.images = mockInspiration.map((image) => ({ ...image }));
          this.seedAvailable = false;
        }
      });
    },
    /** 标记一张图片被收藏（记录收藏时间），不影响灵感板的归属关系。 */
    async markCollected(image: InspirationImage) {
      const collected: InspirationImage = toPlain({ ...image, collectedAt: new Date().toISOString() });
      await withStorage('更新收藏时间', async () => {
        try {
          await db.images.put(collected);
        } catch {
          /* 收藏时间为辅助信息，降级时仅更新内存 */
        }
        const index = this.images.findIndex((item) => item.id === image.id);
        if (index >= 0) this.images[index] = collected;
        else this.images.push(collected);
      });
      return collected;
    },
    getImages(ids: string[]): InspirationImage[] {
      return ids.map((id) => this.imageMap.get(id)).filter((image): image is InspirationImage => Boolean(image));
    }
  }
});
