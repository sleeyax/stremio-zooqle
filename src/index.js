import { addonBuilder } from 'stremio-addon-sdk'
import dotenv from 'dotenv'
import ZooqleClient from './ZooqleClient'
import convertTorrentsToStreams from './convertTorrentsToStreams'
import manifest from './manifest'


dotenv.config()

const builder = new addonBuilder(manifest)

async function findStreams(args) {
  let imdbId = args.id

  if (!imdbId) {
    console.log('No IMDB ID in stream request')
    return
  }

  let torrents

  if (args.type === 'movie') {
    torrents = await client.getMovieTorrents(imdbId)
  } else {
    const season = imdbId.split(':')[1]
    const episode = imdbId.split(':')[2]
    imdbId = imdbId.split(':')[0]
    torrents = await client.getShowTorrents(imdbId, season, episode)
  }

  return convertTorrentsToStreams(torrents)

}

builder.defineStreamHandler((args) => {
  return new Promise(async (resolve, reject) => {
    findStreams(args).then((streams) => {
      if ((streams || []).length) {
        resolve({ streams, cacheMaxAge: 172800 })
      } // two days
      else {
        reject({ streams: [], cacheMaxAge: 3600 })
      } // one hour
    }).catch((err) => {
      /* eslint-disable no-console */
      console.error(
        // eslint-disable-next-line prefer-template
        (new Date().toLocaleString()) +
          ' An error has occurred while processing the following request:'
      )
      console.error(args)
      console.error(err)
      /* eslint-enable no-console */
      reject(err)
    })
  })
})

let client = new ZooqleClient({
  userName: process.env.USERNAME,
  password: process.env.PASSWORD,
  userAgent: 'stremio-zooqle',
  proxy: false,
  cache: '1',
})

const addonInterface = builder.getInterface()

export default addonInterface
