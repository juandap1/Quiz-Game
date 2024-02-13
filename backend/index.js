const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = 5000;
const Spotify = require("./Spotify");

const corOptions = {
  origin: ["http://localhost:9000"],
  methods: ["GET", "POST"],
};
app.use(cors(corOptions));

const spotifyClient = new Spotify(
  process.env.SPOTIFY_CLIENT_ID,
  process.env.SPOTIFY_CLIENT_SECRET
);

spotifyClient.init();

app.get("/playlist", async (req, res) => {
  const playlist = req.query.playlist;
  const response = await spotifyClient.getPlaylist(playlist);
  res.json(response);
});

app.get("/playlist/tracks", async (req, res) => {
  const playlist = req.query.playlist;
  const response = await spotifyClient.getPlaylistTracks(playlist);
  res.json(response);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
