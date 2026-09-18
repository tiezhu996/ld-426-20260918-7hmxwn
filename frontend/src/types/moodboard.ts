export interface MoodBoard {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  coverImageUrl: string;
  imageIds: string[];
  tags: string[];
}

/** 新建灵感板时由表单提供的字段（id / createdAt 由 store 生成） */
export interface NewBoardInput {
  name: string;
  description: string;
}
