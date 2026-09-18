import { defineStore } from 'pinia';
import { MoodBoard, NewBoardInput } from '../types';
import { db } from '../utils/db';
import { readStorage, removeStorage, withStorage, writeStorage } from '../utils/storage';

const SELECTED_BOARD_KEY = 'decor-selected-board';

export const useMoodboardStore = defineStore('moodboards', {
  state: () => ({
    boards: [] as MoodBoard[],
    selectedBoardId: readStorage<string | null>(SELECTED_BOARD_KEY, null),
    loaded: false
  }),
  getters: {
    selectedBoard(state): MoodBoard | undefined {
      return state.boards.find((board) => board.id === state.selectedBoardId);
    }
  },
  actions: {
    /** 读取真实灵感板；不再自动写入任何示例数据，空列表就是空列表 */
    async load() {
      this.boards = await withStorage('读取灵感板', () => db.moodboards.orderBy('createdAt').reverse().toArray());
      if (!this.boards.some((board) => board.id === this.selectedBoardId)) {
        this.selectedBoardId = this.boards[0]?.id ?? null;
        this.persistSelection();
      }
      this.loaded = true;
    },
    selectBoard(boardId: string) {
      if (!this.boards.some((board) => board.id === boardId)) return;
      this.selectedBoardId = boardId;
      this.persistSelection();
    },
    async createBoard(input: NewBoardInput): Promise<MoodBoard> {
      const board: MoodBoard = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        description: input.description.trim(),
        createdAt: new Date().toISOString(),
        coverImageUrl: '',
        imageIds: [],
        tags: []
      };
      await withStorage('新建灵感板', () => db.moodboards.put(board));
      this.boards = await withStorage('刷新灵感板', () => db.moodboards.orderBy('createdAt').reverse().toArray());
      this.selectedBoardId = board.id;
      this.persistSelection();
      return board;
    },
    /**
     * 收藏图片到指定灵感板。
     * 必须先选定一个已存在的板；重复收藏直接返回，不产生重复图片。
     */
    async addImage(boardId: string, imageId: string): Promise<{ added: boolean }> {
      const board = await withStorage('读取目标灵感板', () => db.moodboards.get(boardId));
      if (!board) throw new Error('请先选择一个灵感板');
      if (board.imageIds.includes(imageId)) return { added: false };
      const imageIds = [...board.imageIds, imageId];
      let coverImageUrl = board.coverImageUrl;
      if (!coverImageUrl) {
        const firstImage = await withStorage('读取封面图片', () => db.images.get(imageId));
        coverImageUrl = firstImage?.imageUrl ?? '';
      }
      await withStorage('收藏图片', () => db.moodboards.put({ ...board, imageIds, coverImageUrl }));
      this.boards = await withStorage('刷新灵感板', () => db.moodboards.orderBy('createdAt').reverse().toArray());
      return { added: true };
    },
    /** 持久化拖拽后的图片顺序 */
    async reorder(boardId: string, imageIds: string[]) {
      const board = await withStorage('读取灵感板', () => db.moodboards.get(boardId));
      if (!board) throw new Error('灵感板不存在或已被删除');
      const sameSet = board.imageIds.length === imageIds.length && imageIds.every((id) => board.imageIds.includes(id));
      if (!sameSet) throw new Error('拖拽结果与灵感板图片不一致，已取消保存');
      await withStorage('保存拖拽排列', () => db.moodboards.put({ ...board, imageIds }));
      this.boards = this.boards.map((item) => (item.id === boardId ? { ...item, imageIds } : item));
    },
    persistSelection() {
      try {
        if (this.selectedBoardId) writeStorage(SELECTED_BOARD_KEY, this.selectedBoardId);
        else removeStorage(SELECTED_BOARD_KEY);
      } catch {
        /* 仅记忆选择失败，不阻断主流程 */
      }
    }
  }
});
