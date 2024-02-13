import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
  state: () => ({
    playlist: null,
    tracks: [],
  }),
  getters: {},
  actions: {},
});
