import { DecorStyle } from './enums';

export interface StyleProfile {
  /** 主键：单次测试结果 ID */
  id: string;
  userId: string;
  scores: Record<DecorStyle, number>;
  primaryStyle: DecorStyle;
  secondaryStyle: DecorStyle;
  testedAt: string;
  completed: boolean;
}
