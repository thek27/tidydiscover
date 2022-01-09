const { spotifyApi, getPlaylists, copyPlaylist } = require("./lib");

const dayjs = require("dayjs");

const month = dayjs().format("MMM");

let playlistCopyName = `Discover ${month}`;

spotifyApi.getMe().then(
  function (data) {
    getPlaylists(data.body.id).then(function (items) {
      let playlistDiscoverWeeklyId = null;
      let playlistCopyId = null;
      items.forEach((item) => {
        console.log(item.name);
        if (item.name == "Discover Weekly") {
          playlistDiscoverWeeklyId = item.id;
        }
        if (item.name == playlistCopyName) {
          playlistCopyId = item.id;
        }
      });
      console.log("playlistDiscoverWeeklyId", playlistDiscoverWeeklyId);
      console.log("playlistCopyId", playlistCopyId);

      if (playlistCopyId == null) {
        spotifyApi
          .createPlaylist(playlistCopyName, {
            description: "",
            public: false,
          })
          .then(
            function (data) {
              playlistCopyId = data.body.id;
              console.log(`Playlist ${playlistCopyName} created!`);
              console.log("playlistCopyId", playlistCopyId);
              copyPlaylist(playlistDiscoverWeeklyId, playlistCopyId);
            },
            function (err) {
              console.error(err);
            }
          );
      } else {
        copyPlaylist(playlistDiscoverWeeklyId, playlistCopyId);
      }
    });
  },
  function (err) {
    console.error(err);
  }
);
