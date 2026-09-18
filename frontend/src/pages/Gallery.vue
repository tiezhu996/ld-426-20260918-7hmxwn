<template>
  <section class="space-y-7">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.25em] text-clay">Gallery</p>
        <h1 class="page-title mt-3">按风格和空间筛选灵感</h1>
      </div>
      <div class="space-y-3">
        <FilterTabs v-model="styleValue" :items="styleItems" />
        <FilterTabs v-model="roomValue" :items="roomItems" />
      </div>
    </div>

    <!-- 存储降级时的可恢复提示 -->
    <StorageNotice v-if="showDegraded || boards.storageDegraded" text="收藏暂时无法写入本地，恢复后点击重试即可。" @retry="bootstrap.execute()" @dismiss="dismissDegraded" />

    <!-- 收藏前置：必须先选定一个已存在的灵感板 -->
    <div class="flex flex-col gap-3 bg-paper p-4 ring-1 ring-ink/10 md:flex-row md:items-end md:justify-between">
      <div class="md:w-72">
        <MoodBoardPicker :boards="boards.boards" v-model="selectedBoardId" />
      </div>
      <div class="flex flex-wrap items-center gap-3 text-xs text-ink/60">
        <template v-if="!boards.hasBoards">
          <span>还没有灵感板，先去创建一个，再回来收藏图片。</span>
          <RouterLink class="font-semibold text-clay hover:underline" to="/moodboards">前往新建灵感板 →</RouterLink>
        </template>
        <template v-else-if="selectedBoard">
          <span>当前收藏到：<strong class="text-ink">{{ selectedBoard.name }}</strong>（{{ selectedBoard.imageIds.length }} 张）</span>
          <RouterLink class="text-clay hover:underline" to="/moodboards">管理灵感板</RouterLink>
        </template>
        <span v-if="lastMessage" class="font-semibold" :class="lastDuplicate ? 'text-ochre' : 'text-moss'">{{ lastMessage }}</span>
      </div>
    </div>

    <div v-if="store.filteredImages.length" class="columns-1 gap-5 md:columns-2 xl:columns-3">
      <ImageCard
        v-for="image in store.filteredImages"
        :key="image.id"
        :image="image"
        :collected="isInSelectedBoard(image.id)"
        @collect="collect"
      />
    </div>
    <EmptyState v-else text="当前筛选下没有灵感图片" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import EmptyState from '../components/common/EmptyState.vue';
import FilterTabs from '../components/common/FilterTabs.vue';
import ImageCard from '../components/common/ImageCard.vue';
import MoodBoardPicker from '../components/common/MoodBoardPicker.vue';
import StorageNotice from '../components/common/StorageNotice.vue';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useErrorStore } from '../stores/errorStore';
import { useInspirationStore } from '../stores/inspirationStore';
import { useMoodboardStore } from '../stores/moodboardStore';
import { DecorStyle, InspirationImage, RoomType, toAppError } from '../types';

const store = useInspirationStore();
const boards = useMoodboardStore();
const errors = useErrorStore();
const styleItems = Object.values(DecorStyle);
const roomItems = Object.values(RoomType);
const styleValue = computed({ get: () => store.styleFilter, set: (value) => (store.styleFilter = value as DecorStyle | undefined) });
const roomValue = computed({ get: () => store.roomFilter, set: (value) => (store.roomFilter = value as RoomType | undefined) });

const selectedBoardId = ref<string | undefined>(undefined);
const lastMessage = ref('');
const lastDuplicate = ref(false);
const showDegraded = ref(false);

const selectedBoard = computed(() => (selectedBoardId.value ? boards.getBoard(selectedBoardId.value) : undefined));

const bootstrap = useAsyncAction(
  async () => {
    await store.seed();
    await boards.load();
    if (!selectedBoardId.value && boards.boards.length) selectedBoardId.value = boards.boards[0].id;
  },
  { fallbackMessage: '图集数据加载失败，请重试' }
);

function isInSelectedBoard(imageId: string) {
  return !!selectedBoard.value?.imageIds.includes(imageId);
}

function dismissDegraded() {
  showDegraded.value = false;
  boards.storageDegraded = false;
}

async function collect(image: InspirationImage) {
  lastMessage.value = '';
  // 规则一：先选定已有灵感板
  if (!selectedBoardId.value) {
    lastDuplicate.value = true;
    lastMessage.value = '请先在上方选择一个已有灵感板';
    return;
  }
  const targetBoard = boards.getBoard(selectedBoardId.value);
  if (!targetBoard) {
    lastDuplicate.value = true;
    lastMessage.value = '所选灵感板不存在，请重新选择';
    return;
  }
  // 规则二：重复收藏不增加重复图片（store 内仍会二次去重）
  if (targetBoard.imageIds.includes(image.id)) {
    lastDuplicate.value = true;
    lastMessage.value = '这张图片已在该灵感板中';
    return;
  }

  try {
    const result = await boards.addImage(targetBoard.id, image.id, image.imageUrl);
    await store.markCollected(image);

    if (result.status === 'added') {
      lastDuplicate.value = false;
      lastMessage.value = `已收藏到「${targetBoard.name}」`;
      showDegraded.value = false;
    } else if (result.status === 'duplicate') {
      lastDuplicate.value = true;
      lastMessage.value = '这张图片已在该灵感板中';
    } else {
      lastDuplicate.value = true;
      lastMessage.value = '收藏失败，灵感板可能已被删除，请重新选择';
    }
  } catch (caught) {
    // 本地存储异常：给出可恢复提示，页面其余功能保持可用。
    showDegraded.value = true;
    errors.notify(toAppError(caught, '收藏写入本地存储失败，请重试'), {
      retryable: true,
      retry: () => void collect(image)
    });
  }
}

onMounted(() => bootstrap.execute());
</script>
