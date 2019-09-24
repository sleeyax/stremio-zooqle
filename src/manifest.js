import pkg from '../package'


const manifest = {
  name: 'ZooqleX',
  id: 'com.sleeyax.zooqlex',
  version: pkg.version,
  description: 'Watch movies and series indexed by Zooqle from RARBG, KAT, YTS, MegaTorrents and other torrent trackers',
  types: ['movie', 'series'],
  idPrefixes: ['tt'],
  resources: ['stream'],
  // logo: `${ENDPOINT}/logo-white.png`,
  // icon: `${ENDPOINT}/logo-white.png`,
  // background: `${ENDPOINT}/bg.jpg`,
  catalogs: [],
}

export default manifest
