<template>
  <div class="h-[calc(100vh-65px)] fixed top-[65px]">
    <button
      type="button"
      class="absolute z-10 flex items-center gap-2 p-1 bg-white rounded-full top-6 left-6 text-product-text-primary"
      v-show="isShowResetBtn"
      @click="resetZoom"
    >
      <span
        class="flex items-center justify-center rounded-full material-symbols-outlined bg-product-bg w-9 h-9"
      >
        arrow_back
      </span>
      <p class="pr-2 font-bold">返回</p>
    </button>

    <svg ref="mapSvgElement" class="bg-[#e4faff] h-full w-full"></svg>

    <div
      ref="tooltipElement"
      class="fixed px-2 py-1 text-sm font-bold bg-white text-product-text-primary"
    >
      {{ hoveredTown }}
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import * as topojson from 'topojson-client';
import {
  geoPath, geoMercator, select, json, zoom, zoomIdentity,
} from 'd3';

let cityGeoData = null;
let townGeoData = null;

async function getMapData() {
  const cityData = await json('/data/map/counties.json');
  const townData = await json('/data/map/towns.json');
  cityGeoData = topojson.feature(cityData, cityData.objects.COUNTY_MOI_1090820);
  townGeoData = topojson.feature(townData, townData.objects.TOWN_MOI_1120825);
}

const mapSvgElement = ref(null);

let svg = null;
let map = null;
let pathGenerator = null;

const viewBoxWidth = 500;
const viewBoxHeight = 864;

function drawCitiesMap() {
  const outlyingIslands = ['連江縣', '金門縣', '澎湖縣'];
  const mainIslandsData = cityGeoData.features.filter(
    (item) => !outlyingIslands.includes(item.properties.COUNTYNAME),
  );

  // 轉換座標
  const projection = geoMercator().center([121, 24]).scale(13000).translate([260, 330]);

  // 路徑生成
  pathGenerator = geoPath().projection(projection);

  svg = select(mapSvgElement.value);

  // 繪製地圖
  map = svg
    .attr('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
    .selectAll('path')
    .data(mainIslandsData)
    .enter()
    .append('path')
    .attr('d', pathGenerator)
    .attr('class', 'city')
    .attr('data-name', (d) => d.properties.COUNTYNAME);

  // 地圖上顯示的縣市名稱
  // 去掉縣、市 以及 只留一個嘉義、新竹
  mainIslandsData.forEach((item, index) => {
    if (item.properties.COUNTYNAME === '嘉義市' || item.properties.COUNTYNAME === '新竹市') {
      return;
    }
    const newName = item.properties.COUNTYNAME.replace(/縣|市/g, '');
    mainIslandsData[index].properties.mapShowName = newName;
  });

  // 加入縣市名稱
  svg
    .selectAll('.city-name')
    .data(mainIslandsData)
    .enter()
    .append('text')
    .attr('class', 'city-name')
    .text((d) => d.properties.mapShowName)
    .attr('x', (d) => pathGenerator.centroid(d)[0])
    .attr('y', (d) => pathGenerator.centroid(d)[1])
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'central');
}

let zoomBehavior = null;
const isShowResetBtn = ref(false);

const tooltipElement = ref(null);
const hoveredTown = ref(null);

function handleMapZoom() {
  // 定義縮放
  zoomBehavior = zoom()
    .scaleExtent([1, 8])
    .on('zoom', (event) => {
      const { transform } = event;
      const [x, y] = transform.apply([0, 0]); // 取得經過 transform 變換的原點座標

      svg.selectAll('path').attr('transform', transform);

      // 設定拖曳範圍
      const minX = viewBoxWidth / 2 - viewBoxWidth * transform.k;
      const maxX = viewBoxWidth / 2 / transform.k;
      const minY = viewBoxHeight / 2 - viewBoxHeight * transform.k;
      const maxY = viewBoxHeight / 2 / transform.k;

      const newX = Math.min(maxX, Math.max(minX, x));
      const newY = Math.min(maxY, Math.max(minY, y));

      transform.x = newX;
      transform.y = newY;

      svg.selectAll('path').attr('transform', transform);

      svg
        .selectAll('text')
        .attr('transform', transform)
        .style('font-size', `${16 / transform.k}px`);
    });

  svg.call(zoomBehavior).on('dblclick.zoom', null); // 移除雙擊事件

  // 點擊放大，查看該縣市的鄉鎮市區
  map.on('click', (event, d) => {
    svg.selectAll('.city-name').style('display', 'none');
    svg.selectAll('.town').remove();

    const centroid = pathGenerator.centroid(d);
    const [x, y] = centroid;

    const scale = 2.5;

    svg
      .transition()
      .duration(750)
      .call(
        zoomBehavior.transform,
        zoomIdentity
          .translate(viewBoxWidth / 2 - x * scale, viewBoxHeight / 2 - y * scale)
          .scale(scale),
      );

    const currentCity = d.properties.COUNTYNAME;
    const selectedTownData = townGeoData.features.filter(
      (town) => town.properties.COUNTYNAME === currentCity,
    );

    // 繪製鄉鎮市區地圖
    const townMap = svg
      .selectAll('.town')
      .data(selectedTownData)
      .enter()
      .append('path')
      .attr('d', (town) => pathGenerator(town))
      .attr('data-name', (data) => data.properties.TOWNNAME)
      .attr('class', 'town');

    // hover 顯示鄉鎮市區名稱
    townMap
      .on('mouseover', (e, data) => {
        tooltipElement.value.style.display = 'block';
        hoveredTown.value = data.properties.TOWNNAME;
      })
      .on('mousemove', (e) => {
        tooltipElement.value.style.left = `${e.pageX + 10}px`;
        tooltipElement.value.style.top = `${e.pageY - window.scrollY + 10}px`;
      })
      .on('mouseout', () => {
        tooltipElement.value.style.display = 'none';
        hoveredTown.value = null;
      });

    isShowResetBtn.value = true;
  });
}

function resetZoom() {
  svg.selectAll('.city-name').style('display', 'block');
  svg.selectAll('.town').remove();
  svg.transition().duration(750).call(zoomBehavior.transform, zoomIdentity);

  isShowResetBtn.value = false;
}

onMounted(async () => {
  await getMapData();
  drawCitiesMap();
  handleMapZoom();
});
</script>

<style lang="scss">
.city,
.town {
  cursor: pointer;

  &:hover {
    filter: brightness(1.02);
  }
}

.city {
  fill: #ebf0e4;

  &-name {
    fill: #ffffff;
    text-shadow:
      -1px -1px #334155,
      1px 1px #334155,
      1px -1px #334155,
      -1px 1px #334155;
    font-weight: 700;
    pointer-events: none;
  }
}

.town {
  fill: #ebf0e4;
  stroke: #ffffff;
  stroke-width: 1px;
}
</style>
