import { DecorStyle } from './enums';

export interface StyleProfile {
  /** 单次测试结果的唯一主键（同一用户可多次测试，形成历史）。 */
  id: string;
  /** 稳定的用户标识，用于检索该用户的全部测试历史。 */
  userId: string;
  scores: Record<DecorStyle, number>;
  primaryStyle: DecorStyle;
  secondaryStyle: DecorStyle;
  testedAt: string;
  completed: boolean;
}
