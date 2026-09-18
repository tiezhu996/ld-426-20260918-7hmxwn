import { STYLE_COLORS } from '../constants/styleColors';
import { DecorStyle, InspirationImage, MoodBoard } from '../types';

const STYLE_ORDER = Object.values(DecorStyle);

/** 根据灵感板内图片的风格分布推导风格标签（出现次数多者优先） */
export function deriveBoardStyles(images: InspirationImage[]): DecorStyle[] {
  const counts = new Map<DecorStyle, number>();
  images.forEach((image) => counts.set(image.style, (counts.get(image.style) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || STYLE_ORDER.indexOf(a[0]) - STYLE_ORDER.indexOf(b[0]))
    .map(([style]) => style);
}

/** 由风格标签同步颜色方案，保证标签与颜色始终一一对应 */
export function stylesToColors(styles: DecorStyle[]): string[] {
  return styles.map((style) => STYLE_COLORS[style]);
}

/** 取板内第一张可用图片作为封面；板为空时返回空串由调用方展示占位 */
export function deriveCover(board: MoodBoard, images: InspirationImage[]): string {
  const first = board.imageIds.map((id) => images.find((image) => image.id === id)).find(Boolean);
  return first?.imageUrl ?? '';
}
