const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
const SpotifyWebApi = require("spotify-web-api-node");

const fs = require("fs");
const os = require("os");
const path = require("path");
const opn = require("opn");

const envFilePath = path.resolve(__dirname, ".env");
const readEnvVars = () => fs.readFileSync(envFilePath, "utf-8").split(os.EOL);

require("dotenv").config();

const setEnvValue = (key, value) => {
  const envVars = readEnvVars();
  const targetLine = envVars.find((line) => line.split("=")[0] === key);
  if (targetLine !== undefined) {
    // update existing line
    const targetLineIndex = envVars.indexOf(targetLine);
    // replace the key/value with the new value
    envVars.splice(targetLineIndex, 1, `${key}="${value}"`);
  } else {
    // create new key value
    envVars.push(`${key}="${value}"`);
  }
  // write everything back to the file system
  fs.writeFileSync(envFilePath, envVars.join(os.EOL));
};

const port = 8888;

// credentials are optional
const spotifyApi = new SpotifyWebApi();

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// Use the SpotifyStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, expires_in
//   and spotify profile), and invoke a callback with a user object.
passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    function (accessToken, refreshToken, expires_in, profile, done) {
      // asynchronous verification, for effect...
      console.log("accessToken", accessToken);
      setEnvValue("ACCESS_TOKEN", accessToken);
      process.nextTick(function () {
        // To keep the example simple, the user's spotify profile is returned to
        // represent the logged-in user. In a typical application, you would want
        // to associate the spotify account with a user record in your database,
        // and return that user instead.
        return done(null, accessToken);
      });
    }
  )
);

const app = express();

app.use(session({ secret: "secret", resave: true, saveUninitialized: true }));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/",
  passport.authenticate("spotify", {
    scope: [
      "user-read-email",
      "user-read-private",
      "playlist-read-private",
      "playlist-modify-private",
    ],
    showDialog: true,
  })
);

// GET /callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  "/callback",
  passport.authenticate("spotify", { failureRedirect: "/" }),
  function (req, res) {
    res.redirect("/account");
  }
);

app.get("/account", ensureAuthenticated, function (req, res) {
  spotifyApi.setAccessToken(req.user);

  spotifyApi
    .getPlaylist("37i9dQZEVXcGP1pEVio3pZ") // Discover Weekly
    .then(function (data) {
      return data.body.tracks.items.map(function (item) {
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
    })
    .then(
      function (data) {
        res.send(data);
        // console.log(data);
      },
      function (err) {
        res.send("!");
        console.error(err);
      }
    );
});

app.listen(port, function () {
  console.log("App is listening on port " + port);
  opn("http:/localhost:" + port);
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}
