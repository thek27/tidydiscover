const { spotifyApi, getPlaylists, copyPlaylist } = require("./lib");

let playlistCopyName = `Discover 2021`;

function copyPlaylists(sources, destId) {
  if (sources.length == 0) {
    console.log("Backup Finished!");
    return;
  }
  const source = sources.shift();
  console.log(source.name);
  copyPlaylist(source.id, destId, function () {
    copyPlaylists(sources, destId);
  });
}

spotifyApi.getMe().then(
  function (data) {
    getPlaylists(data.body.id).then(function (items) {
      let playlistRediscover = [];
      let playlistCopyId = null;
      items.forEach((item) => {
        if (item.name.indexOf("Rediscover") > -1) {
          playlistRediscover.push(item);
        }
        if (item.name == playlistCopyName) {
          playlistCopyId = item.id;
        }
      });
      console.log("playlistRediscover", playlistRediscover.length);
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
              copyPlaylists(playlistRediscover, playlistCopyId);
            },
            function (err) {
              console.error(err);
            }
          );
      } else {
        copyPlaylists(playlistRediscover, playlistCopyId);
      }
    });
  },
  function (err) {
    console.error(err);
  }
);
