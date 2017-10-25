/**
 * Initialize HTTP server
 */

require('park-ranger')();
var app = require('app');

if (!process.env.PERSONAL_SERVER_PORT) {
  throw new Error('App failed to find port variable from environment');
}

module.exports = app.listen(process.env.PERSONAL_SERVER_PORT);