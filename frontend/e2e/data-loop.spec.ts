import { BrowserContext, expect, Page, test } from '@playwright/test';

async function gotoFresh(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

test.describe('家居装饰平台本地数据闭环', () => {
  // 每个用例显式创建独立 BrowserContext：IndexedDB 按 context 分区，
  // 保证全新存储，互不污染。
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    await context.route('**/images.unsplash.com/**', (route) =>
      route.fulfill({ status: 200, path: 'public/test-fixture.jpg', contentType: 'image/jpeg' })
    );
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('完成测试后主辅风格与得分保存，刷新/档案页可读回', async () => {
    await gotoFresh(page, '/quiz');

    // 空档案不卡死：直接展示第一道题
    await expect(page.getByRole('button', { name: '保持开阔、方便社交' })).toBeVisible();

    // 依次回答三道题
    await page.getByRole('button', { name: '保持开阔、方便社交' }).click();
    await page.getByRole('button', { name: '水泥、金属、皮革' }).click();
    await page.getByRole('button', { name: '黑、白、灰和一处强对比' }).click();

    // 结果页：主辅风格 + 雷达图
    await expect(page.getByText('主风格').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByText('辅风格')).toBeVisible();

    // 刷新后仍直接展示已保存的结果
    await page.goto('/quiz');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByText('主风格').first()).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();

    // 个人档案页读回主辅风格与得分
    await page.goto('/profile');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByText('主风格').first()).toBeVisible();
    await expect(page.getByText('辅风格')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('图集必须先选定已有灵感板；重复收藏不重复；新建板与拖拽刷新保留', async () => {
    await gotoFresh(page, '/moodboards');
    await expect(page.getByText(/还没有灵感板/)).toBeVisible();
    await page.getByPlaceholder(/灵感板名称/).fill('E2E 暖色木作');
    await page.getByPlaceholder(/描述/).fill('端到端验证板');
    await page.getByRole('button', { name: '创建并选中' }).click();
    await expect(page.getByText('E2E 暖色木作').first()).toBeVisible();

    // 刷新后新建的板仍在，且自动选中
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByText('E2E 暖色木作').first()).toBeVisible();
    await expect(page.getByText('当前选中')).toBeVisible();

    // 图集页：已默认选中已有板，可以收藏
    await page.goto('/gallery');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.locator('select').first()).toContainText('E2E 暖色木作');

    const firstCard = page.locator('article').first();
    await firstCard.getByRole('button', { name: /收藏到灵感板/ }).click();
    await expect(firstCard.getByRole('button', { name: '已收藏' })).toBeVisible();
    await expect(page.getByText(/已收藏到/)).toBeVisible();

    // 已收藏按钮为禁用态，重复点击不会再加入图片（按钮自身防重复 + Store 去重双保险）
    await expect(firstCard.getByRole('button', { name: '已收藏' })).toBeDisabled();
    await page.goto('/moodboards');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByText('1 张').first()).toBeVisible();

    // 再收藏两张
    await page.goto('/gallery');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.locator('article').nth(1).getByRole('button', { name: /收藏到灵感板/ }).click();
    await expect(page.locator('article').nth(1).getByRole('button', { name: '已收藏' })).toBeVisible();
    await page.locator('article').nth(2).getByRole('button', { name: /收藏到灵感板/ }).click();
    await expect(page.locator('article').nth(2).getByRole('button', { name: '已收藏' })).toBeVisible();

    // 灵感板详情：三张图，刷新后保留
    await page.goto('/moodboards');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByText('3 张').first()).toBeVisible();
    await expect(page.locator('.cursor-grab')).toHaveCount(3);
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.locator('.cursor-grab')).toHaveCount(3);

    // 拖拽重排：把最后一张拖到第一张，刷新后顺序保留
    const cards = page.locator('.cursor-grab');
    const firstBox = await cards.first().boundingBox();
    const lastBox = await cards.last().boundingBox();
    if (firstBox && lastBox) {
      await page.mouse.move(lastBox.x + 5, lastBox.y + 5);
      await page.mouse.down();
      await page.mouse.move(firstBox.x + 15, firstBox.y + 15, { steps: 10 });
      await page.mouse.up();
    }
    await expect(page.getByText('已保存')).toBeVisible({ timeout: 5000 });
    const orderAfterDrag = await page.locator('.cursor-grab img').evaluateAll((imgs) =>
      imgs.map((img) => (img as HTMLImageElement).src)
    );
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const orderAfterReload = await page.locator('.cursor-grab img').evaluateAll((imgs) =>
      imgs.map((img) => (img as HTMLImageElement).src)
    );
    expect(orderAfterReload).toEqual(orderAfterDrag);
  });

  test('方案对比只读取真实灵感板并同步标签颜色；空数据有提示', async () => {
    // 全新用户：对比页空态，不出现假方案
    await gotoFresh(page, '/compare');
    await expect(page.getByText(/还没有可对比的方案/)).toBeVisible();

    // 建板 + 收藏图片
    await page.goto('/moodboards');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.getByPlaceholder(/灵感板名称/).fill('对比测试板');
    await page.getByRole('button', { name: '创建并选中' }).click();

    await page.goto('/gallery');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.locator('article').first().getByRole('button', { name: /收藏到灵感板/ }).click();
    await expect(page.locator('article').first().getByRole('button', { name: '已收藏' })).toBeVisible();

    // 加入对比：风格标签与颜色由板内图片同步
    await page.goto('/compare');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.locator('select').first().selectOption({ index: 1 });
    await page.getByRole('button', { name: '加入对比' }).click();
    const panel = page.locator('article').filter({ hasText: '对比测试板' });
    await expect(panel).toBeVisible();
    await expect(panel.locator('span[class*="rounded-full"]').first()).toBeVisible();
    await expect(panel.locator('span[title^="#"]').first()).toBeVisible();
    await expect(panel.locator('.aspect-square')).toHaveCount(1);

    // 刷新后方案仍在
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const refreshed = page.locator('article').filter({ hasText: '对比测试板' });
    await expect(refreshed).toBeVisible();
    await expect(refreshed.locator('span[title^="#"]').first()).toBeVisible();
  });

  test('图片加载异常时显示可恢复提示，且不阻断收藏', async () => {
    // 返回损坏的图片字节：浏览器解码失败会触发 img error（等价于图片 URL 异常），
    // 同时避免无头浏览器对 aborted 大图重复解码导致渲染器崩溃
    await context.unroute('**/images.unsplash.com/**').catch(() => undefined);
    await context.route('**/images.unsplash.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/jpeg',
        body: Buffer.from('this-is-not-a-valid-image')
      })
    );

    await page.goto('/moodboards');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.getByPlaceholder(/灵感板名称/).fill('异常测试板');
    await page.getByRole('button', { name: '创建并选中' }).click();
    await page.goto('/gallery');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByText('图片加载失败').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: '重新加载' }).first()).toBeVisible();

    // 图片失败不影响收藏流程
    await page.locator('article').first().getByRole('button', { name: /收藏到灵感板/ }).click();
    await expect(page.locator('article').first().getByRole('button', { name: '已收藏' })).toBeVisible();
  });

  test('IndexedDB 不可用时显示可恢复提示，页面不白屏', async ({ browser }) => {
    // 关闭常规 context，另建一个让 IndexedDB.open 抛错的 context，
    // 模拟隐私模式 / 存储被禁用
    await context.close();
    context = await browser.newContext();
    await context.addInitScript(() => {
      window.indexedDB.open = () => {
        throw new DOMException('Simulated storage failure', 'InvalidStateError');
      };
    });
    await context.route('**/images.unsplash.com/**', (route) =>
      route.fulfill({ status: 200, path: 'public/test-fixture.jpg', contentType: 'image/jpeg' })
    );
    page = await context.newPage();

    await page.goto('/profile');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: '重试' }).first()).toBeVisible();
    // 页面主体仍渲染，没有白屏
    await expect(page.getByText('个人风格档案')).toBeVisible();
  });
});
