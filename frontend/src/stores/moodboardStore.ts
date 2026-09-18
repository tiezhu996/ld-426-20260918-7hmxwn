import { defineStore } from 'pinia';
import { MoodBoard } from '../types';
import { db } from '../utils/db';
import { readLocalBackup, removeLocalBackup, STORAGE_KEYS, withStorage, writeLocalBackup } from '../utils/safeStorage';
import { toPlain } from '../utils/toPlain';

export type AddImageResult =
  | { status: 'added' }
  | { status: 'duplicate' }
  | { status: 'board-not-found' };

export const useMoodboardStore = defineStore('moodboards', {
  state: () => ({
    boards: [] as MoodBoard[],
    storageDegraded: false
  }),
  getters: {
    hasBoards: (state) => state.boards.length > 0,
    boardMap(state) {
      return new Map(state.boards.map((board) => [board.id, board]));
    }
  },
  actions: {
    getBoard(id: string): MoodBoard | undefined {
      return this.boardMap.get(id);
    },
    /** 读取真实存在的灵感板；IndexedDB 异常时降级到 localStorage 备份，空库返回空数组。 */
    async load() {
      await withStorage('读取灵感板', async () => {
        try {
          const records = await db.moodboards.orderBy('createdAt').reverse().toArray();
          this.boards = records;
          this.storageDegraded = false;
          // 库可正常打开：以库为准同步备份（库为空时备份也应清空，二者一致）。
          writeLocalBackup(STORAGE_KEYS.moodboards, records);
        } catch {
          this.storageDegraded = true;
          // 仅在读取失败时使用备份；绝不用“空结果”覆盖已有备份。
          this.boards = readLocalBackup<MoodBoard[]>(STORAGE_KEYS.moodboards) ?? [];
        }
      });
    },
    /** 新建灵感板（名称必填），创建后刷新仍保留。 */
    async createBoard(name: string, description = '', imageIds: string[] = []) {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('灵感板名称不能为空');
      const board: MoodBoard = {
        id: crypto.randomUUID(),
        name: trimmed,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        coverImageUrl: '',
        imageIds: [...new Set(imageIds)],
        tags: []
      };
      await withStorage('创建灵感板', async () => {
        try {
          await db.moodboards.put(toPlain(board));
          this.storageDegraded = false;
        } catch (cause) {
          this.storageDegraded = true;
          if (!writeLocalBackup(STORAGE_KEYS.moodboards, [board, ...this.boards])) throw cause;
        }
      });
      await this.load();
      return board;
    },
    /**
     * 收藏图片到「已存在的」灵感板。
     * - boardId 必须指向真实灵感板（图集页先选板再收藏）；
     * - 重复收藏直接返回 duplicate，不写入重复图片 ID。
     */
    async addImage(boardId: string, imageId: string, coverImageUrl = ''): Promise<AddImageResult> {
      const board = this.boardMap.get(boardId);
      if (!board) return { status: 'board-not-found' };
      if (board.imageIds.includes(imageId)) return { status: 'duplicate' };

      const updated: MoodBoard = {
        ...toPlain(board),
        imageIds: [...board.imageIds, imageId],
        coverImageUrl: board.coverImageUrl || coverImageUrl
      };

      await withStorage('收藏图片', async () => {
        try {
          await db.moodboards.put(toPlain(updated));
          this.storageDegraded = false;
        } catch (cause) {
          this.storageDegraded = true;
          const fallback = this.boards.map((item) => (item.id === board.id ? updated : item));
          if (!writeLocalBackup(STORAGE_KEYS.moodboards, fallback)) throw cause;
        }
      });
      await this.load();
      return { status: 'added' };
    },
    /** 持久化拖拽后的图片顺序，刷新后仍保留。 */
    async reorder(boardId: string, imageIds: string[]) {
      const board = this.boardMap.get(boardId);
      if (!board) return;
      // 只允许重排已属于该板的图片，防止脏数据混入。
      const knownIds = new Set(board.imageIds);
      const nextIds = imageIds.filter((id) => knownIds.has(id));
      if (nextIds.length !== board.imageIds.length) return;
      const updated = { ...toPlain(board), imageIds: nextIds };
      await withStorage('保存排列顺序', async () => {
        try {
          await db.moodboards.put(toPlain(updated));
        } catch (cause) {
          if (!writeLocalBackup(STORAGE_KEYS.moodboards, this.boards.map((item) => (item.id === board.id ? updated : item)))) {
            throw cause;
          }
        }
      });
      await this.load();
    },
    async removeBoard(boardId: string) {
      await withStorage('删除灵感板', async () => {
        await db.moodboards.delete(boardId);
        if (this.boards.length <= 1) removeLocalBackup(STORAGE_KEYS.moodboards);
      });
      await this.load();
    }
  }
});
