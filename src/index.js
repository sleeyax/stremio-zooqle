import http from 'http'
import Stremio from 'stremio-addons'
import serveStatic from 'serve-static'
import chalk from 'chalk'
import magnet from 'magnet-uri'
import parseTorrentName from 'torrent-name-parser'
import pkg from '../package.json'
import ZooqleClient from './ZooqleClient'


const STATIC_DIR = 'static'
const USER_AGENT = 'stremio-zooqle'
const DEFAULT_ID = 'stremio_zooqle'
const ID_PROPERTY = 'imdb_id'
const MIN_SEEDERS = 7
const STREAMS_PER_CATEGORY = 2

const ID = process.env.STREMIO_ZOOQLE_ID || DEFAULT_ID
const ENDPOINT = process.env.STREMIO_ZOOQLE_ENDPOINT || 'http://localhost'
const PORT = process.env.STREMIO_ZOOQLE_PORT || '80'
const EMAIL = process.env.STREMIO_ZOOQLE_EMAIL
const USERNAME = process.env.STREMIO_ZOOQLE_USERNAME
const PASSWORD = process.env.STREMIO_ZOOQLE_PASSWORD
const IS_PROD = process.env.NODE_ENV === 'production'


if (IS_PROD && ID === DEFAULT_ID) {
  // eslint-disable-next-line no-console
  console.error(
    chalk.red(
      '\nWhen running in production, a non-default addon identifier must be specified\n'
    )
  )
  process.exit(1)
}


const MANIFEST = {
  name: 'Zooqle',
  id: ID,
  version: pkg.version,
  description: '',
  types: ['movie', 'series'],
  idProperty: ID_PROPERTY,
  dontAnnounce: !IS_PROD,
  email: EMAIL,
  contactEmail: EMAIL,
  endpoint: ENDPOINT,
  logo: `${ENDPOINT}/logo.png`,
  icon: `${ENDPOINT}/logo.png`,
  background: `${ENDPOINT}/bg.jpg`,
}


let client = new ZooqleClient({
  userName: USERNAME,
  password: PASSWORD,
  userAgent: USER_AGENT,
})

function makeDetailsString(prefix, ...args) {
  let string = args
    .filter((arg, i) => arg && args.indexOf(arg) === i)
    .join(' ')
  return string ? `${prefix} ${string}` : undefined
}

async function findStreams(req) {
  let imdbId = req.query && req.query.imdb_id

  if (!imdbId) {
    return
  }

  let torrents = await client.getTorrents(imdbId)
  let streamsByCategory = {}

  return torrents
    .filter(({ category, seeders = 0, languages = [] }) => {
      if (seeders < MIN_SEEDERS || (
        languages.length && !languages.includes('EN')
      )) {
        return false
      }

      streamsByCategory[category] = streamsByCategory[category] || 0
      streamsByCategory[category]++
      return streamsByCategory[category] <= STREAMS_PER_CATEGORY
    })
    .map(({ magnetLink, category, seeders, audio, languages = [] }) => {
      let { infoHash, name } = magnet.decode(magnetLink)
      let { resolution, quality } = parseTorrentName(name)
      let videoDetails = makeDetailsString('📺', category, resolution, quality)
      let audioDetails = makeDetailsString('🔉', audio, ...languages)
      let seedersDetails = makeDetailsString('👤', seeders)
      let availability = 1

      if (seeders >= 50) {
        availability = 3
      } else if (seeders >= 20) {
        availability = 2
      }

      let title = [videoDetails, audioDetails, seedersDetails]
        .filter((val) => val)
        .join(', ')

      let result = {
        name: 'Zooqle',
        tag: resolution ? [resolution] : undefined,
        availability,
        title,
        infoHash,
      }
      return result
    })
}


let methods = {
  'stream.find': (req, cb) => {
    findStreams(req).then(
      (res) => cb(null, res),
      (err) => {
        /* eslint-disable no-console */
        console.error(
          'An error has occurred while processing the following request:'
        )
        console.error(req)
        console.error(err)
        /* eslint-enable no-console */
        cb(err)
      }
    )
  },
}
let addon = new Stremio.Server(methods, MANIFEST)
let server = http.createServer((req, res) => {
  serveStatic(STATIC_DIR)(req, res, () => {
    addon.middleware(req, res, () => res.end())
  })
})

server
  .on('listening', () => {
    let values = {
      endpoint: chalk.green(ENDPOINT),
      id: ID === DEFAULT_ID ? chalk.red(ID) : chalk.green(ID),
      email: EMAIL ? chalk.green(EMAIL) : chalk.red('undefined'),
      env: IS_PROD ? chalk.green('production') : chalk.green('development'),
    }

    // eslint-disable-next-line no-console
    console.log(`
    Zooqle Addon is live

    Endpoint:    ${values.endpoint}
    Addon Id:    ${values.id}
    Email:       ${values.email}
    Environment: ${values.env}
    `)
  })
  .listen(PORT)


export default server
