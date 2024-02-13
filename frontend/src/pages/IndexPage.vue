<template>
  <q-page class="flex flex-center bg-dark">
    <div class="record-cont" id="playBtn">
      <img class="record-img" src="Record.svg" />
      <q-icon class="record-icon" name="img:play.png" />
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import * as d3 from "d3";

export default defineComponent({
  name: "IndexPage",
  data() {
    return {
      context: null,
      soundsrc: null,
      analyzer: null,
      frequency: null,
    };
  },
  methods: {
    init() {
      d3.select("#playBtn")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .append("defs");

      var radial = d3
        .select("defs")
        .append("radialGradient")
        .attr("id", "gradient")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%")
        .attr("fx", "50%")
        .attr("fy", "50%");

      radial
        .append("stop")
        .attr("offset", "80%")
        .style("stop-color", "rgb(0,0,0)")
        .style("stop-opacity", 0);
      radial
        .append("stop")
        .attr("offset", "90%")
        .attr("id", "colored")
        .style("stop-color", "#00bfff")
        .style("stop-opacity", 1);
      radial
        .append("stop")
        .attr("offset", "100%")
        .style("stop-color", "rgb(0,0,0)")
        .style("stop-opacity", 0);
    },
    async getRefreshToken() {
      // refresh token that has been previously stored
      const refreshToken = localStorage.getItem("refresh_token");
      const url = "https://accounts.spotify.com/api/token";

      const payload = {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: clientId,
        }),
      };
      const body = await fetch(url, payload);
      const response = await body.json();

      localStorage.setItem("access_token", response.accessToken);
      localStorage.setItem("refresh_token", response.refreshToken);
    },
    async getPlaylist(url) {
      const regex = /\/playlist\/(.+?)(\?.+)?$/;
      const found = url.match(regex);
      const playlistId = found[1];
      fetch(
        "http://localhost:5000/playlist?" +
          new URLSearchParams({
            playlist: playlistId,
          }),
        {
          method: "GET",
        }
      )
        .then(async (response) => {
          const json = await response.json();
          console.log(json);
        })
        .catch((err) => {
          console.error(err);
        });
    },
    getAudioContext() {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      if (window.AudioContext) {
        return new AudioContext();
      }
      return null;
    },
    visualizer() {
      this.context = this.getAudioContext();
      this.soundsrc = this.context.createBufferSource();
      this.analyzer = this.context.createAnalyser();
      this.frequency = new Uint8Array(this.analyzer.frequencyBinCount);

      this.soundsrc.buffer = buffer;
      this.soundsrc.connect(this.context.destination);
      this.soundsrc.connect(this.analyzer);
    },
  },
  mounted() {
    this.init();
    this.getPlaylist(
      "https://open.spotify.com/playlist/4dZQRXBixDTzIfPsIBiqxD?si=857083d354784fed"
    );
  },
});
</script>
<style scoped>
.record-cont {
  width: 350px;
  height: 350px;
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.record-img {
  border-radius: 50%;
  transition: scale 0.5s;
  z-index: 2;
}

.record-cont:hover .record-img {
  scale: 1.03;
}

.record-icon {
  font-size: 48px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
}
</style>
