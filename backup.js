const { spotifyApi, getPlaylists, copyPlaylist } = require("./lib")

let playlistCopyName = `Discover 2024`

function copyPlaylists(sources, destId) {
    if (sources.length == 0) {
        console.log("Backup Finished!")
        return
    }
    const source = sources.shift()
    console.log(source.name)
    copyPlaylist(source.id, destId, function () {
        copyPlaylists(sources, destId)
    })
}

const dayjs = require("dayjs")

spotifyApi.getMe().then(
    function (data) {
        getPlaylists(data.body.id).then(function (items) {
            let playlistCopyId = null
            let playlistMonthDiscover = []
            for (let m = 1; m <= 12; m++) {
                const month = dayjs(`2024-${m}-1`).format("MMM")
                items.forEach((item) => {
                    if (item.name.indexOf(`Discover ${month}`) > -1) {
                        playlistMonthDiscover.push(item)
                    }
                    if (item.name == playlistCopyName) {
                        playlistCopyId = item.id
                    }
                })
            }
            console.log("playlistMonthDiscover", playlistMonthDiscover.length)
            console.log("playlistCopyId", playlistCopyId)

            if (playlistCopyId !== null) {
                copyPlaylists(playlistMonthDiscover, playlistCopyId)
            }
        })
    },
    function (err) {
        console.error(err)
    }
)
