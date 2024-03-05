import { defineStore } from 'pinia';
import axios from 'axios';

const votesStore = defineStore('votesStore', {
  state: () => ({
    years: ['1996', '2000', '2004', '2008', '2012', '2016', '2020', '2024'],
    currentYear: '',
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
  },
});

export default votesStore;
