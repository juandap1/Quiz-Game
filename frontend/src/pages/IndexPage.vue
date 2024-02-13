<template>
  <q-page class="flex flex-center bg-dark">
    <div class="record-cont" id="playBtn" @click="start">
      <img class="record-img" src="Record.svg" />
      <q-icon v-if="!playing" class="record-icon" name="img:play.png" />
      <q-icon v-else class="record-icon" name="img:eighth-note.png" />
      <!-- <audio v-if="store.tracks.length != 0" ref="previewComp">
        <source :src="store.tracks[0].preview_url" />
      </audio> -->
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import * as d3 from "d3";
import { useAppStore } from "src/stores/appStore";

export default defineComponent({
  name: "IndexPage",
  setup() {
    const store = useAppStore();
    return {
      store,
    };
  },
  data() {
    return {
      context: null,
      soundsrc: null,
      analyzer: null,
      frequency: null,
      playing: false,
      buffer: null,
    };
  },
  methods: {
    start() {
      if (this.playing) {
        this.soundsrc.stop();
      } else {
        this.visualizer();
      }
      this.playing = !this.playing;
    },
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
    fetchAudio(url) {
      return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";
        request.onload = () => {
          this.context.decodeAudioData(
            request.response,
            function (buffer) {
              resolve(buffer);
            },
            function () {}
          );
        };
        request.onerror = (e) => reject(e);
        request.send();
      });
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
      if (useAppStore().playlist == null) {
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
            useAppStore().playlist = json;
            this.getPlaylistTracks(playlistId);
          })
          .catch((err) => {
            console.error(err);
          });
      }
    },
    async getPlaylistTracks(id) {
      fetch(
        "http://localhost:5000/playlist/tracks?" +
          new URLSearchParams({
            playlist: id,
          }),
        {
          method: "GET",
        }
      )
        .then(async (response) => {
          const json = await response.json();
          const tracks = json.items
            .map((x) => x.track)
            .filter((x) => x.preview_url != null);
          useAppStore().tracks = tracks;
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
    async visualizer() {
      this.context = this.getAudioContext();
      this.buffer = await this.fetchAudio(useAppStore().tracks[0].preview_url);
      this.soundsrc = this.context.createBufferSource();
      this.analyzer = this.context.createAnalyser();
      this.frequency = new Uint8Array(this.analyzer.frequencyBinCount);

      this.soundsrc.buffer = this.buffer;
      this.soundsrc.connect(this.context.destination);
      this.soundsrc.connect(this.analyzer);
      this.soundsrc.start();
      this.render();
    },
    render() {
      var max = 255;
      let color =
        "rgb(" +
        Math.floor(Math.random() * max) +
        ", " +
        Math.floor(Math.random() * max) +
        ", " +
        Math.floor(Math.random() * max) +
        ")";
      if (this.playing) {
        requestAnimationFrame(this.render);
      }
      this.analyzer.getByteFrequencyData(this.frequency);
      d3.select("#colored").style("stop-color", color);
      d3.select("#playBtn")
        .select("svg")
        .selectAll("circle")
        .data(this.frequency.slice(0, 10))
        .attr("r", function (d) {
          return (d / 255) * 50 + "%";
        })
        .enter()
        .append("circle")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("fill", "url(#gradient)");
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
  width: 500px;
  height: 500px;
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.record-img {
  width: 350px;
  height: 350px;
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
