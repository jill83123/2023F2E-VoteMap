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
        <div class="px-4 pt-6 pb-5 border border-product-line rounded-xl">
          <div class="flex justify-between mb-8">
            <h3 class="text-xl font-bold">歷屆政黨得票率</h3>
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
          <div ref="partiesVotesPercentChart" class="w-full h-full px-2"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { select, scaleBand, axisBottom, scaleLinear, axisLeft, line } from 'd3';
import createVotesStore from '@/stores/votesStore';

let svgWidth = null;
const svgHeight = 210;

const marginLeft = 57;
const marginBottom = 28;
const xPadding = 16;

function createSvg(chartRef) {
  svgWidth = chartRef.value.clientWidth;

  const svg = select(chartRef.value)
    .append('svg')
    .attr('width', svgWidth - xPadding)
    .attr('height', svgHeight)
    .style('overflow', 'visible');

  return svg;
}

function createChartContainer(svg) {
  const chartContainer = svg
    .append('g')
    .attr('transform', `translate(${marginLeft}, -${marginBottom})`);

  return chartContainer;
}

const votesStore = createVotesStore();
const { years, pastPartiesVotes } = votesStore;

// ------------ 設定 xy 軸比例尺 ------------ //
function createScaleX() {
  const scaleX = scaleBand()
    .domain(years)
    .range([0, svgWidth - xPadding - marginLeft]);

  return scaleX;
}

function createScaleY(key) {
  const maxData = Math.max(
    ...years.map((year) => pastPartiesVotes[year].map((obj) => obj[key])).flat(),
  );
  const scaleY = scaleLinear()
    .domain([0, maxData])
    .range([svgHeight, marginBottom + 2]);

  return scaleY;
}

// ------------ 繪製 xy 軸 ------------ //
function drawAxisX({ svg, scaleX }) {
  const xAxis = svg
    .append('g')
    .attr('transform', `translate(${marginLeft}, ${svgHeight - marginBottom})`)
    .call(axisBottom(scaleX).ticks(years.length).tickSize(0));
  xAxis.selectAll('text').attr('transform', 'translate(0, 10)');
  xAxis.select('.domain').remove();
}

function drawAxisY({ svg, scaleY, contentType }) {
  const yAxis = svg
    .append('g')
    .call(
      axisLeft(scaleY)
        .ticks(5)
        .tickSize(0)
        .tickFormat((d) => (contentType === 'votes' ? `${d / 10000} 萬` : `${d}%`)),
    )
    .attr('transform', `translate(${marginLeft}, -${marginBottom})`);
  yAxis.selectAll('.tick text').attr('transform', 'translate(-14, 1)');
  yAxis.select('.domain').remove();

  // 背景線
  yAxis
    .selectAll('.tick')
    .append('line')
    .attr('x1', -12)
    .attr('x2', svgWidth - xPadding - marginLeft)
    .attr('stroke', '#DEE2E6');
}

// ------------ 繪製長條圖 ------------ //
const partiesVotesChart = ref(null);
function drawVotesChart() {
  const svg = createSvg(partiesVotesChart);

  // 繪製 x 軸
  const scaleX = createScaleX();
  drawAxisX({ svg, scaleX });

  // 繪製 y 軸
  const scaleY = createScaleY('ticketNum');
  drawAxisY({ svg, scaleY, contentType: 'votes' });

  const barWidth = 12;

  // x 軸子群組比例尺
  const xSubgroupScales = {};
  years.forEach((year) => {
    const scale = scaleBand()
      .domain(pastPartiesVotes[year].map((d) => `${year}-${d.partyName}-${d.candNo}`))
      .range([0, pastPartiesVotes[year].length * (barWidth + 2)]);
    xSubgroupScales[year] = scale;
  });

  // 繪製 bar
  const chartContainer = createChartContainer(svg);

  years.forEach((year) => {
    const subGroupScale = xSubgroupScales[year];
    const barGroup = chartContainer
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
      .attr('fill', (d) => d.partyColor)
      .attr('data-name', (d) => d.partyName)
      .attr('data-votes', (d) => d.ticketNum);
  });
}

const partiesVotesPercentChart = ref(null);
function drawPercentChart() {
  const svg = createSvg(partiesVotesPercentChart);

  // 繪製 x 軸
  const scaleX = createScaleX();
  drawAxisX({ svg, scaleX });

  // 繪製 y 軸
  const scaleY = createScaleY('ticketPercent');
  drawAxisY({ svg, scaleY, contentType: 'votesPercent' });

  // 調整資料結構
  const allData = years.map((year) => pastPartiesVotes[year].map((item) => item)).flat();

  const groupedData = allData.reduce((acc, cur) => {
    const { partyName } = cur;
    if (partyName === '連署') {
      let counter = 1;
      while (acc[`連署 ${counter}`]) {
        counter += 1;
      }
      acc[`連署 ${counter}`] = [cur];
    } else if (!acc[partyName]) {
      acc[partyName] = [...(acc[partyName] || []), cur];
    } else {
      acc[partyName].push(cur);
    }
    return acc;
  }, {});

  const newData = Object.entries(groupedData).map(([partyName, values]) => ({
    name: partyName,
    color: values[0].partyColor,
    values: values.map((item) => ({
      time: item.year,
      value: item.ticketPercent,
    })),
  }));

  // 繪製折線
  const lineGenerator = line()
    .x((d) => scaleX(d.time))
    .y((d) => scaleY(d.value));

  const chartContainer = createChartContainer(svg);

  chartContainer
    .append('g')
    .selectAll('myLines')
    .data(newData)
    .join('path')
    .attr('d', (d) => lineGenerator(d.values))
    .attr('data-name', (d) => d.name)
    .attr('stroke', (d) => d.color)
    .style('stroke-width', 1.5)
    .style('fill', 'none')
    .attr('transform', `translate(${scaleX.bandwidth() / 2}, 0)`);

  // 繪製點
  chartContainer
    .append('g')
    .selectAll('myDots')
    .data(newData)
    .join('g')
    .attr('data-name', (d) => d.name)
    .style('fill', (d) => d.color)
    .selectAll('myPoints')
    .data((d) => d.values)
    .join('circle')
    .attr('cx', (d) => scaleX(d.time))
    .attr('cy', (d) => scaleY(d.value))
    .attr('r', 4)
    .attr('data-percent', (d) => `${d.value}%`)
    .attr('transform', `translate(${scaleX.bandwidth() / 2}, 0)`);
}

const tagData = ref(null);
function getTagData() {
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
  drawPercentChart();
  getTagData();
});
</script>

<style lang="postcss">
.tick text {
  @apply text-xs text-product-text-primary;
}
</style>
