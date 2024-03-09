<template>
  <nav class="container fixed left-0 right-0 top-0 max-w-full px-6 py-3 bg-white z-30">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <h1 class="mr-6 flex items-center">
          <img src="../assets/images/logo.png" alt="logo" class="mr-2" />
          <span class="font-mantou text-[28px] text-product-text-primary">台灣歷年總統 都幾?</span>
        </h1>
        <div class="relative mr-4 flex items-center">
          <p class="mr-3 font-bold text-product-text-primary">選擇年份</p>
          <div
            class="menu flex min-h-[40px] w-[118px] cursor-pointer items-center justify-between rounded-full bg-product-bg px-4 py-2"
            :class="{ active: currentActiveMenu === 'year' }"
            @click="toggleMenu('year')">
            <p>{{ currentOption.year }}</p>
            <span class="material-symbols-outlined select-none text-base text-product-text-primary">
              expand_more
            </span>
            <ul
              class="menu-item absolute left-0 right-0 top-[50px] z-10 rounded-lg border border-product-line bg-white py-2">
              <li
                v-for="year in yearReversed"
                :key="year"
                class="cursor-pointer px-4 py-2 hover:bg-gray-100"
                @click.stop="toggleMenu('year', year)">
                {{ year }}
              </li>
            </ul>
          </div>
        </div>
        <div class="flex items-center rounded-full bg-product-bg px-3 py-2">
          <span class="material-symbols-outlined select-none text-xl leading-5 text-gray-800">
            search
          </span>
          <div
            class="menu relative flex w-[194px] cursor-pointer items-center justify-between"
            :class="{ active: currentActiveMenu === 'city' }"
            @click="toggleMenu('city')">
            <div class="flex items-center">
              <p class="ml-3">{{ currentOption.city ? currentOption.city : '全部縣市' }}</p>
              <ul
                class="menu-item absolute left-0 right-0 top-[44px] z-10 max-h-[496px] overflow-y-scroll rounded-lg border border-product-line bg-white py-2">
                <li
                  v-for="city in cities"
                  :key="city"
                  class="cursor-pointer px-4 py-2 hover:bg-gray-100"
                  @click.stop="toggleMenu('city', city)">
                  {{ city }}
                </li>
              </ul>
            </div>
            <span
              class="material-symbols-outlined select-none px-3 text-xl leading-5 text-product-text-primary">
              expand_more
            </span>
          </div>
          <div
            class="menu relative flex w-[194px] items-center justify-between"
            :class="{
              active: currentActiveMenu === 'town',
              'cursor-pointer text-product-text-primary': towns?.length,
              'pointer-events-none text-gray-600': !towns?.length,
            }"
            @click="toggleMenu('town')">
            <p class="border-l border-gray-400 px-4 leading-4">
              {{ currentOption.town ? currentOption.town : '選擇區域' }}
            </p>
            <span class="material-symbols-outlined select-none px-3 text-xl leading-5">
              expand_more
            </span>
            <ul
              class="menu-item absolute left-0 right-0 top-[44px] z-10 max-h-[496px] overflow-y-scroll rounded-lg border border-product-line bg-white py-2">
              <li
                v-for="town in towns"
                :key="town"
                class="cursor-pointer px-4 py-2 hover:bg-gray-100"
                @click.stop="toggleMenu('town', town)">
                {{ town }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <p>分享</p>
        <ul class="flex items-center gap-4">
          <li>
            <a href="#"><img src="../assets/images/icon-fb.png" alt="facebook-icon" /></a>
          </li>
          <li>
            <a href="#"><img src="../assets/images/icon-ig.png" alt="instagram-icon" /></a>
          </li>
          <li>
            <a href="#"><img src="../assets/images/icon-yt.png" alt="youtube-icon" /></a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import createVotesStore from '@/stores/votesStore';
import { ref, toRefs } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const emit = defineEmits(['handleMenuChange']);

const votesStore = createVotesStore();
const { years, cities, towns, currentOption } = toRefs(votesStore);

const yearReversed = [...years.value].reverse();
const currentActiveMenu = ref(null);

function toggleMenu(type, value) {
  const currentRoute = router.currentRoute.value;

  if (type && value) {
    emit('handleMenuChange');

    const queryParams = { ...currentRoute.query, [type]: value };
    if (type === 'city') delete queryParams.town;

    router.push({
      path: currentRoute.path,
      query: queryParams,
    });

    votesStore.changeCurrentOption(type, value);
    currentActiveMenu.value = '';
    return;
  }

  // 關閉選單
  if (currentActiveMenu.value === type) {
    currentActiveMenu.value = '';
    return;
  }

  currentActiveMenu.value = type;
}
</script>

<style lang="scss">
.menu {
  .menu-item {
    opacity: 0;
    pointer-events: none;
  }
  .material-symbols-outlined {
    transform: rotate(0deg);
  }

  .menu-item,
  .material-symbols-outlined {
    transition: all 0.2s linear;
  }

  &.active {
    .menu-item {
      opacity: 1;
      pointer-events: auto;
    }
    .material-symbols-outlined {
      transform: rotate(180deg);
    }
  }
}
</style>

<style lang="postcss">
/* 捲軸寬度及高度 */
.menu ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
/* 軌道背景底色 */
.menu ::-webkit-scrollbar-track {
  @apply rounded-3xl bg-product-bg;
}

/* 滑桿顏色 */
.menu ::-webkit-scrollbar-thumb {
  @apply rounded-3xl bg-gray-600;
}
/* 滑桿滑鼠滑入時的顏色 */
.menu ::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500;
}
</style>
