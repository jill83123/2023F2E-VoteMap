<template>
  <section class="py-3">
    <div class="row">
      <div class="w-1/2 col">
        <div class="px-4 pt-6 pb-5 border border-product-line rounded-xl">
          <div class="flex justify-between mb-8">
            <h3 class="text-xl font-bold">歷屆政黨得票數</h3>
            <div class="flex flex-wrap items-center text-xs gap-[6px]">
              <div v-for="tag in tagData" :key="tag.name">
                <div
                  class="inline-block w-2 h-2 mr-1 rounded-full"
                  :style="`background-color: ${tag.color}`"
                ></div>
                <p class="inline-block">{{ tag.name }}</p>
              </div>
            </div>
          </div>
          <div ref="partiesVotesChart" class="w-full h-full px-2"></div>
        </div>
      </div>
      <div class="w-1/2 col">
        <div class="px-4 py-6 border border-product-line rounded-xl">
          <h3 class="text-xl font-bold">歷屆政黨得票率</h3>
          <div ref="partiesVotesPercentChart"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  select, scaleBand, axisBottom, scaleLinear, axisLeft,
} from 'd3';
import createVotesStore from '@/stores/votesStore';

const votesStore = createVotesStore();

const partiesVotesChart = ref(null);
function drawVotesChart() {
  const svgWidth = partiesVotesChart.value.clientWidth;
  const svgHeight = 210;

  const marginLeft = 57;
  const marginBottom = 28;
  const xPadding = 16;

  const svg = select(partiesVotesChart.value)
    .append('svg')
    .attr('width', svgWidth - xPadding)
    .attr('height', svgHeight);

  // x 軸尺度
  const { years } = votesStore;
  const scaleX = scaleBand()
    .domain(years)
    .range([0, svgWidth - xPadding - marginLeft]);
  // 繪製
  const xAxis = svg
    .append('g')
    .attr('transform', `translate(${marginLeft}, ${svgHeight - marginBottom})`)
    .call(axisBottom(scaleX).ticks(years.length).tickSize(0));
  xAxis.selectAll('text').attr('transform', 'translate(0, 10)');
  xAxis.select('.domain').remove();

  // y 軸尺度
  const { pastPartiesVotes } = votesStore;
  const allVotes = years.map((year) => pastPartiesVotes[year].map((item) => item.ticketNum)).flat();
  const maxVotes = Math.max(...allVotes);
  const scaleY = scaleLinear().domain([0, maxVotes]).range([svgHeight, marginBottom + 2]);
  // 繪製
  const yAxis = svg
    .append('g')
    .call(
      axisLeft(scaleY)
        .ticks(5)
        .tickSize(0)
        .tickFormat((d) => `${d / 10000} 萬`),
    )
    .attr('transform', `translate(${marginLeft}, -${marginBottom})`);
  yAxis.select('.domain').remove();
  yAxis.selectAll('.tick text').attr('transform', 'translate(-14, 1)');

  // y 軸背景線
  yAxis
    .selectAll('.tick')
    .append('line')
    .attr('x1', -12)
    .attr('x2', svgWidth - xPadding - marginLeft)
    .attr('y1', 0)
    .attr('y2', 0)
    .attr('stroke', '#DEE2E6');

  const barWidth = 12;

  // x 軸子群組尺度
  const xSubgroupScales = {};
  years.forEach((year) => {
    const scale = scaleBand()
      .domain(pastPartiesVotes[year].map((data) => `${year}-${data.partyName}-${data.candNo}`))
      .range([0, pastPartiesVotes[year].length * (barWidth + 2)]);
    xSubgroupScales[year] = scale;
  });
  // 繪製
  const barContainer = svg
    .append('g')
    .attr('transform', `translate(${marginLeft}, ${-marginBottom})`);
  years.forEach((year) => {
    const subGroupScale = xSubgroupScales[year];
    const barGroup = barContainer
      .append('g')
      .attr(
        'transform',
        () => `translate(${
          scaleX(year)
            + scaleX.bandwidth() / 2
            - (pastPartiesVotes[year].length * (barWidth + 2)) / 2
        }, 0)`,
      )
      .attr('data-year', year);
    barGroup
      .selectAll('g')
      .data(pastPartiesVotes[year])
      .join('rect')
      .attr('x', (d) => subGroupScale(`${year}-${d.partyName}-${d.candNo}`))
      .attr('y', (d) => scaleY(d.ticketNum))
      .attr('width', barWidth)
      .attr('height', (d) => svgHeight - scaleY(d.ticketNum))
      .attr('data-name', (d) => d.partyName)
      .attr('data-votes', (d) => d.ticketNum)
      .attr('fill', (d) => d.partyColor);
  });
}

const partiesVotesPercentChart = ref(null);

const tagData = ref(null);
function getTagData() {
  const { years, pastPartiesVotes } = votesStore;
  const data = {};
  let otherData = {};
  years.forEach((year) => {
    pastPartiesVotes[year].forEach((item) => {
      if (item.partyName === '連署' || item.partyName === '無黨籍及未經政黨推薦') {
        otherData = { name: '其它', color: item.partyColor };
      } else if (!data[item.partyName]) {
        data[item.partyName] = item.partyColor;
      }
    });
  });
  if (otherData) {
    data[otherData.name] = otherData.color;
  }
  tagData.value = Object.entries(data).map(([name, color]) => ({ name, color }));
}

onMounted(async () => {
  await votesStore.getPastPartiesVotes();
  drawVotesChart();
  getTagData();
});
</script>

<style lang="postcss">
.tick text {
  @apply text-xs text-product-text-primary;
}
</style>
