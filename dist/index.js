"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _stremioAddonSdk = require("stremio-addon-sdk");

var _dotenv = _interopRequireDefault(require("dotenv"));

var _ZooqleClient = _interopRequireDefault(require("./ZooqleClient"));

var _convertTorrentsToStreams = _interopRequireDefault(require("./convertTorrentsToStreams"));

var _manifest = _interopRequireDefault(require("./manifest"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

_dotenv.default.config();

const builder = new _stremioAddonSdk.addonBuilder(_manifest.default);

function findStreams(_x) {
  return _findStreams.apply(this, arguments);
}

function _findStreams() {
  _findStreams = _asyncToGenerator(function* (args) {
    let imdbId = args.id;

    if (!imdbId) {
      console.log('No IMDB ID in stream request');
      return;
    }

    let torrents;

    if (args.type === 'movie') {
      torrents = yield client.getMovieTorrents(imdbId);
    } else {
      const season = imdbId.split(':')[1];
      const episode = imdbId.split(':')[2];
      imdbId = imdbId.split(':')[0];
      torrents = yield client.getShowTorrents(imdbId, season, episode);
    }

    return (0, _convertTorrentsToStreams.default)(torrents);
  });
  return _findStreams.apply(this, arguments);
}

builder.defineStreamHandler(args => {
  return new Promise(
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(function* (resolve, reject) {
      findStreams(args).then(streams => {
        if ((streams || []).length) {
          resolve({
            streams,
            cacheMaxAge: 172800
          });
        } // two days
        else {
            reject({
              streams: [],
              cacheMaxAge: 3600
            });
          } // one hour

      }).catch(err => {
        /* eslint-disable no-console */
        console.error( // eslint-disable-next-line prefer-template
        new Date().toLocaleString() + ' An error has occurred while processing the following request:');
        console.error(args);
        console.error(err);
        /* eslint-enable no-console */

        reject(err);
      });
    });

    return function (_x2, _x3) {
      return _ref.apply(this, arguments);
    };
  }());
});
let client = new _ZooqleClient.default({
  userName: process.env.USER,
  password: process.env.PASSWORD,
  userAgent: 'stremio-zooqle',
  proxy: false,
  cache: '1'
});
const addonInterface = builder.getInterface();
var _default = addonInterface;
exports.default = _default;
//# sourceMappingURL=index.js.map