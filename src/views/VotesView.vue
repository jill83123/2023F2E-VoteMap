<template>
  <Nav @handleMenuChange="handleMenuChange"></Nav>
  <template v-if="isDataLoaded">
    <TaiwanMap></TaiwanMap>
    <Chart></Chart>
  </template>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import createVotesStore from '@/stores/votesStore';

import Nav from '@/components/NavComponent.vue';
import TaiwanMap from '@/components/TaiwanMap.vue';
import Chart from '@/components/ChartComponent.vue';

const route = useRoute();
const router = useRouter();

const votesStore = createVotesStore();
const { years } = votesStore;

function checkRouteOptionValue(option, value) {
  const checkOption = option === 'city' ? 'cities' : `${option}s`;

  if (votesStore[checkOption]?.includes(value)) {
    votesStore.changeCurrentOption(option, value);
    return true;
  }

  // 查無選項，調整當前路由和選項
  const newQuery = {
    year: option === 'year' ? years[years.length - 1] : route.query.year,
    ...(option === 'town' && { city: route.query.city }),
  };
  router.push({ query: newQuery });

  votesStore.changeCurrentOption('city', option === 'town' ? route.query.city : '');
  votesStore.changeCurrentOption('town', '');

  console.log(`查無選項為 ${value} 的 ${option} 資料`); // 這裡暫時用 console
  return false;
}

const isDataLoaded = ref(false);
onMounted(async () => {
  await votesStore.getAllData();
  isDataLoaded.value = true;

  // 如果路由沒有年份，預設為最新的年份
  if (!route.query.year) {
    const currentRoute = router.currentRoute.value;
    router.push({ query: { ...currentRoute.query, year: years[years.length - 1] } });
  }

  // 驗證選項
  Object.entries(route.query).forEach(([query, value]) => {
    checkRouteOptionValue(query, value);
  });
});

// 避免 nav 選擇時和 watch 監聽路由重複觸發 changeCurrentOption
let isMenuChange = false;
function handleMenuChange() {
  isMenuChange = !isMenuChange;
}

watch(
  () => route.query,
  (newQuery, oldQuery) => {
    if (isMenuChange) {
      handleMenuChange();
      return;
    }

    // 驗證選項
    Object.entries(newQuery).forEach(([query, value]) => {
      if (value !== oldQuery[query]) {
        checkRouteOptionValue(query, value);
      }
    });
  },
);
</script>
