import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { createPinia, setActivePinia } from 'pinia';
import { DecorStyle, RoomType } from '../types';
import type { InspirationImage, StyleProfile } from '../types';
import { db } from '../utils/db';
import { useProfileStore } from '../stores/profileStore';
import { useInspirationStore } from '../stores/inspirationStore';
import { useMoodboardStore } from '../stores/moodboardStore';
import { useComparisonStore } from '../stores/comparisonStore';
import { readStorage, writeStorage } from '../utils/storage';

const sampleImage = (id: string, style: DecorStyle): InspirationImage => ({
  id,
  imageUrl: `https://example.com/${id}.jpg`,
  style,
  roomType: RoomType.LivingRoom,
  tags: [],
  sourceDescription: id
});

describe('本地数据闭环', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.close();
  });

  it('保存主辅风格与得分后，重新读取档案能读回', async () => {
    const profile: StyleProfile = {
      id: 'profile-1',
      userId: 'local-user',
      scores: {
        [DecorStyle.Modern]: 100,
        [DecorStyle.Chinese]: 20,
        [DecorStyle.Nordic]: 60,
        [DecorStyle.Japanese]: 30,
        [DecorStyle.Industrial]: 10,
        [DecorStyle.Mediterranean]: 0,
        [DecorStyle.Minimalist]: 40
      },
      primaryStyle: DecorStyle.Modern,
      secondaryStyle: DecorStyle.Nordic,
      testedAt: '2026-09-17T08:00:00.000Z',
      completed: true
    };

    const first = useProfileStore();
    await first.saveProfile(profile);
    expect(first.profile?.primaryStyle).toBe(DecorStyle.Modern);
    expect(first.profile?.secondaryStyle).toBe(DecorStyle.Nordic);
    expect(first.profile?.scores[DecorStyle.Nordic]).toBe(60);

    // 模拟页面刷新：新建 pinia 实例重新读取
    setActivePinia(createPinia());
    const reloaded = useProfileStore();
    await reloaded.loadProfile();
    expect(reloaded.profile).toMatchObject({
      primaryStyle: DecorStyle.Modern,
      secondaryStyle: DecorStyle.Nordic
    });
    expect(reloaded.profile?.scores[DecorStyle.Modern]).toBe(100);
  });

  it('收藏必须指定已存在的灵感板，重复收藏不增加重复图片', async () => {
    const boards = useMoodboardStore();
    await boards.load();
    expect(boards.boards).toHaveLength(0);
    expect(boards.selectedBoardId).toBeNull();
    expect(boards.selectedBoard).toBeUndefined();

    // 未选定板时 addImage 必须拒绝
    await expect(boards.addImage('missing-board', 'img-1')).rejects.toThrow(/请先选择/);

    const board = await boards.createBoard({ name: '我的灵感板', description: '测试' });
    await boards.addImage(board.id, 'img-1');
    const second = await boards.addImage(board.id, 'img-1');
    expect(second.added).toBe(false);

    // 同一张图可以分别收藏到不同灵感板（只在同一板内去重）
    const other = await boards.createBoard({ name: '第二个板', description: '' });
    const cross = await boards.addImage(other.id, 'img-1');
    expect(cross.added).toBe(true);

    setActivePinia(createPinia());
    const refreshed = useMoodboardStore();
    await refreshed.load();
    expect(refreshed.boards).toHaveLength(2);
    expect(refreshed.boards.find((item) => item.id === board.id)?.imageIds).toEqual(['img-1']);
  });

  it('拖拽顺序与新建灵感板在重新加载后保留', async () => {
    const boards = useMoodboardStore();
    await boards.load();
    const board = await boards.createBoard({ name: '排序板', description: '' });
    await boards.addImage(board.id, 'a');
    await boards.addImage(board.id, 'b');
    await boards.addImage(board.id, 'c');
    await boards.reorder(board.id, ['c', 'a', 'b']);

    setActivePinia(createPinia());
    const refreshed = useMoodboardStore();
    await refreshed.load();
    const found = refreshed.boards.find((item) => item.id === board.id);
    expect(found?.imageIds).toEqual(['c', 'a', 'b']);
    expect(found?.name).toBe('排序板');
    // 选中的板也被记忆
    expect(refreshed.selectedBoardId).toBe(board.id);
  });

  it('方案对比只读取真实灵感板，并同步风格标签与颜色', async () => {
    const inspiration = useInspirationStore();
    await db.images.bulkPut([sampleImage('n1', DecorStyle.Nordic), sampleImage('n2', DecorStyle.Nordic), sampleImage('j1', DecorStyle.Japanese)]);
    await inspiration.seed();

    const boards = useMoodboardStore();
    await boards.load();
    const board = await boards.createBoard({ name: '混搭板', description: '' });
    await boards.addImage(board.id, 'n1');
    await boards.addImage(board.id, 'n2');
    await boards.addImage(board.id, 'j1');

    const comparison = useComparisonStore();
    await comparison.load();
    expect(comparison.plans).toHaveLength(0); // 没有真实方案时不造数据

    await comparison.addPlan(board.id);
    setActivePinia(createPinia());
    const reloadedComparison = useComparisonStore();
    await reloadedComparison.load();
    expect(reloadedComparison.plans).toHaveLength(1);
    const plan = reloadedComparison.plans[0];
    expect(plan.name).toBe('混搭板');
    expect(plan.styleTags.slice(0, 2)).toEqual([DecorStyle.Nordic, DecorStyle.Japanese]);
    expect(plan.colors[0]).toBe('#7fa4a0'); // STYLE_COLORS.Nordic

    // 板内图片变化（模拟在图集中继续收藏），重新加载对比页时标签/颜色同步
    const refreshedBoards = useMoodboardStore();
    await db.images.put(sampleImage('m1', DecorStyle.Modern));
    await refreshedBoards.addImage(board.id, 'm1');
    await reloadedComparison.load();
    const synced = reloadedComparison.plans[0];
    expect(synced.styleTags).toContain(DecorStyle.Modern);
    expect(synced.colors).toHaveLength(synced.styleTags.length);

    // 灵感板被删除后，对应方案不应再被读出
    await db.moodboards.delete(board.id);
    await reloadedComparison.load();
    expect(reloadedComparison.plans).toHaveLength(0);
  });

  it('localStorage JSON 损坏时安全回退，不抛异常', () => {
    localStorage.setItem('broken-key', '{不是合法JSON');
    expect(readStorage('broken-key', 'fallback')).toBe('fallback');
    expect(() => writeStorage('ok-key', { a: 1 })).not.toThrow();
    expect(readStorage('ok-key', null)).toEqual({ a: 1 });
  });
});
