import { defineStore } from 'pinia';
import axios from 'axios';

const votesStore = defineStore('votesStore', {
  state: () => ({
    years: ['1996', '2000', '2004', '2008', '2012', '2016', '2020', '2024'],
    cities: [],
    towns: [],
    currentOption: {
      year: '',
      city: '',
      town: '',
    },
    externalData: {
      regionData: {},
      regionVoteData: {},
      partyData: {},
      partyColorData: {},
      candidateData: {},
      candidateVoteData: {},
    },
    pastPartiesVotes: {},
  }),

  actions: {
    async getAllData() {
      const promises = this.years.map(async (year) => {
        // 行政區基本資料
        const regionData = await axios.get(`/data/vote/${year}/elbase.json`);
        this.externalData.regionData[year] = regionData.data;

        // 政黨基本資料
        const partyData = await axios.get(`/data/vote/${year}/elpaty.json`);
        this.externalData.partyData[year] = partyData.data;

        // 候選人基本資料
        const candidateData = await axios.get(`/data/vote/${year}/elcand.json`);
        this.externalData.candidateData[year] = candidateData.data;

        // 候選人得票檔
        const candidateVoteData = await axios.get(`/data/vote/${year}/elctks.json`);
        this.externalData.candidateVoteData[year] = candidateVoteData.data;

        // 選舉概況檔
        const regionVoteData = await axios.get(`/data/vote/${year}/elcand.json`);
        this.externalData.regionVoteData[year] = regionVoteData.data;

        // 政黨顏色
        const partyColorData = await axios.get('/data/vote/party-color.json');
        this.externalData.partyColorData = partyColorData.data;
      });

      await Promise.all(promises);
    },

    getPastPartiesVotes() {
      this.years.forEach(async (year) => {
        this.pastPartiesVotes[year] = [];

        this.externalData.candidateVoteData[year].forEach((data) => {
          if (data.prv_code === '00') {
            const currentCandVoteData = this.externalData.candidateData[year].find(
              (item) => item.cand_no === data.cand_no,
            );
            const partyData = this.externalData.partyData[year].find(
              (item) => item.party_code === currentCandVoteData.party_code,
            );
            const colorData = this.externalData.partyColorData.find(
              (item) => item.party_name === partyData.party_name,
            );
            const newData = {
              year,
              candNo: data.cand_no,
              ticketNum: data.ticket_num,
              ticketPercent: data.ticket_percent,
              partyName: partyData.party_name,
              partyColor: colorData?.color || '#DEE2E6',
            };
            this.pastPartiesVotes[year].push(newData);
          }
          this.pastPartiesVotes[year].sort((a, b) => b.ticketPercent - a.ticketPercent);
        });
      });
    },

    changeCurrentOption(option, value) {
      this.currentOption[option] = value;
      if (option === 'year') {
        this.getAllCitesName(value);
      } else if (option === 'city') {
        this.currentOption.town = '';
        this.getTownsInCity();
      }
    },

    getAllCitesName(year) {
      this.cities = [];

      const filterData = (data) => data.area_code === '00'
        && data.dept_code === '000'
        && data.li_code === '0000'
        && data.area_name !== '臺灣省'
        && data.area_name !== '福建省';

      this.externalData.regionData[year].forEach((data) => {
        if (filterData(data)) {
          this.cities.push(data.area_name);
        }
      });

      // 把全國的選項移到最前面
      const all = this.cities.pop();
      this.cities.unshift(all);
    },

    getTownsInCity() {
      this.towns = [];

      const { year, city } = this.currentOption;
      const currentCityData = this.externalData.regionData[year].find(
        (data) => data.area_name === city,
      );

      const filterData = (data) => data.prv_code === currentCityData?.prv_code
        && data.city_code === currentCityData?.city_code
        && data.li_code === '0000'
        && data.dept_code !== '000';

      this.externalData.regionData[year].forEach((data) => {
        if (filterData(data)) {
          this.towns.push(data.area_name);
        }
      });
    },
  },
});

export default votesStore;
