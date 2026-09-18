import { defineStore } from 'pinia';
import { mockInspiration } from '../api/mockInspiration';
import { DecorStyle, InspirationImage, RoomType } from '../types';
import { db } from '../utils/db';
import { withStorage } from '../utils/storage';

export const useInspirationStore = defineStore('inspiration', {
  state: () => ({
    images: [] as InspirationImage[],
    styleFilter: undefined as DecorStyle | undefined,
    roomFilter: undefined as RoomType | undefined,
    /** 已收藏到任一灵感板的图片 ID（内存派生，避免重复图片） */
    collectedIds: [] as string[]
  }),
  getters: {
    filteredImages(state) {
      return state.images.filter(
        (image) =>
          (!state.styleFilter || image.style === state.styleFilter) &&
          (!state.roomFilter || image.roomType === state.roomFilter)
      );
    },
    imageMap(state): Map<string, InspirationImage> {
      return new Map(state.images.map((image) => [image.id, image]));
    }
  },
  actions: {
    /** 首次进入时写入内置图集；seed 失败或图库为空都不抛到页面层 */
    async seed() {
      await withStorage('初始化灵感图集', async () => {
        if ((await db.images.count()) === 0) await db.images.bulkPut(mockInspiration);
      });
      this.images = await withStorage('读取灵感图集', () => db.images.toArray());
      if (!this.images.length) this.images = [...mockInspiration];
      await this.refreshCollected();
    },
    isCollected(imageId: string) {
      return this.collectedIds.includes(imageId);
    },
    /** 以各灵感板的真实数据同步收藏集合 */
    async refreshCollected() {
      const boards = await withStorage('同步收藏状态', () => db.moodboards.toArray());
      this.collectedIds = [...new Set(boards.flatMap((board) => board.imageIds))];
    }
  }
});
