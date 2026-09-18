import { STYLE_COLORS } from '../constants/styleColors';
import { DecorStyle, InspirationImage } from '../types';
import type { MoodBoard } from '../types';

export interface BoardSyncResult {
  styleTags: DecorStyle[];
  colors: string[];
}

/**
 * 方案的风格标签与颜色永远派生自灵感板内真实图片的风格，
 * 按出现次数从高到低排列，保证两者始终同步。
 */
export function syncPlanFromBoard(board: MoodBoard, images: InspirationImage[]): BoardSyncResult {
  const counts = new Map<DecorStyle, number>();
  images.forEach((image) => {
    counts.set(image.style, (counts.get(image.style) ?? 0) + 1);
  });
  const styleTags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([style]) => style);

  return {
    styleTags,
    colors: styleTags.map((style) => STYLE_COLORS[style])
  };
}
