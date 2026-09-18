# 家居装饰风格测试与灵感收集平台

## 启动方式

```bash
cd frontend
npm install
npm run dev
```

访问地址：http://localhost:18806

## 本地数据闭环

所有数据均存储在浏览器本地（IndexedDB / localStorage），无后端依赖：

- **风格档案**：答完问卷后保存主风格、辅风格与七种风格得分；刷新页面或进入「个人档案」均可读回，并保留历次测试历史。
- **灵感板收藏**：收藏图片前必须先在图集顶部选定（或新建）一个已有灵感板；同一灵感板内重复收藏不会产生重复图片。
- **拖拽与新建**：灵感板创建、卡片拖拽排序即时写入 IndexedDB，刷新后顺序保持不变。
- **方案对比**：只读取真实存在的灵感板；方案的风格标签与颜色始终从板内当前图片重新推导并同步，灵感板删除后对应方案自动清除。
- **异常恢复**：图片加载失败显示占位图与「重新加载」；IndexedDB / localStorage 异常（隐私模式、存储被禁用、JSON 损坏）时页面展示可重试提示，空数据显示空态而不是卡死白屏。

## 测试

```bash
npm run test:unit   # Vitest + fake-indexeddb：存储闭环单元测试
npm run test:e2e    # Playwright：完整用户旅程（含刷新持久化与异常恢复）
npm run typecheck   # vue-tsc 类型检查
```

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Vue 3、TypeScript、Vite |
| UI | Tailwind CSS |
| 图表 | ECharts |
| 拖拽 | vue-draggable-plus |
| 状态 | Pinia |
| 本地存储 | Dexie.js / IndexedDB |
| 路由 | Vue Router 4 |
| 测试 | Vitest、Playwright |

## 目录结构

```text
frontend/src/
  api/ stores/ types/ components/common/ hooks/ pages/ router/ utils/ constants/ styles/
```

## 枚举位置

- 装修风格与房间类型：`frontend/src/types/enums.ts`
- 风格颜色常量：`frontend/src/constants/styleColors.ts`

## License

MIT
