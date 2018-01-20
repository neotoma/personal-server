/**
 * Initialize HTTP server
 */

require('park-ranger')();
var app = require('app');

module.exports = app.listen(process.env.PERSONAL_SERVER_PORT ? process.env.PERSONAL_SERVER_PORT : 9100);
