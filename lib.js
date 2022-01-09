const SpotifyWebApi = require("spotify-web-api-node");

require("dotenv").config();

const spotifyApi = new SpotifyWebApi();

spotifyApi.setAccessToken(process.env.ACCESS_TOKEN);

const getPlaylists = function (userId, offset = 0, limit = 50, lists = []) {
  console.log("offset", offset);
  return new Promise((resolve, reject) =>
    spotifyApi
      .getUserPlaylists(userId, { offset, limit })
      .then((data) => {
        if (data.body.items.length > 0) {
          const items = data.body.items.map(function (item) {
            return { name: item.name, id: item.id };
          });
          lists = lists.concat(items);
          getPlaylists(userId, offset + limit, limit, lists)
            .then(resolve)
            .catch(reject);
        } else {
          resolve(lists);
        }
      })
      .catch(reject)
  );
};

const getPlaylistTracks = function (playlistId) {
  return new Promise((resolve, reject) =>
    spotifyApi
      .getPlaylist(playlistId)
      .then((data) => {
        const tracks = data.body.tracks.items.map(function (item) {
          const track = item.track;
          const artist = track.artists
            .map(function (artist) {
              return artist.name;
            })
            .join(", ");
          return {
            artist,
            name: track.name,
            id: track.uri,
          };
        });
        resolve(tracks);
      })
      .catch(reject)
  );
};

const copyPlaylist = function (sourceId, destId, callback = null) {
  getPlaylistTracks(sourceId).then(function (items) {
    let tracks = items.map(function (track) {
      return {
        uri: track.id,
      };
    });

    spotifyApi.removeTracksFromPlaylist(destId, tracks).then(
      function () {
        let tracks = items.map(({ id }) => id);
        spotifyApi.addTracksToPlaylist(destId, tracks,{position:0}).then(
          function () {
            console.log("Added " + tracks.length + " tracks to playlist!");
            if (callback) callback();
          },
          function (err) {
            console.error(err);
          }
        );
      },
      function (err) {
        console.error(err);
      }
    );
  });
};

module.exports = { spotifyApi, getPlaylists, getPlaylistTracks, copyPlaylist };
