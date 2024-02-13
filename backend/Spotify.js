module.exports = class Spotify {
  constructor(client_id, client_secret) {
    this.client_id = client_id;
    this.client_secret = client_secret;
  }

  async init() {
    fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          new Buffer(this.client_id + ":" + this.client_secret).toString(
            "base64"
          ),
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: "grant_type=client_credentials",
    })
      .then(async (response) => {
        const json = await response.json();
        this.access_token = json.access_token;
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  }

  async getPlaylist(id) {
    const response = await fetch("https://api.spotify.com/v1/playlists/" + id, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.access_token}`,
      },
    });
    if (response.status === 401) {
      await this.init();
      return await this.getPlaylist(id);
    } else {
      return await response.json();
    }
  }
};
