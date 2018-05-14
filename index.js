/**
 * Initialize HTTP and HTTPS servers
 */

let ranger = require('park-ranger')();

var app = require('app'),
  debug = require('debug')('personal-server'),
  http = require('http'),
  https = require('https');

let httpsPort = process.env.PERSONAL_SERVER_HTTPS_PORT ? process.env.PERSONAL_SERVER_HTTPS_PORT : 9101,
httpPort = process.env.PERSONAL_SERVER_HTTP_PORT ? process.env.PERSONAL_SERVER_HTTP_PORT : 9100;

if (ranger.cert) {
  https.createServer(ranger.cert, app).listen(httpsPort, () => {
    debug('Ember server started listening for HTTPS requests', { port: httpsPort});
  });
}

http.createServer(app).listen(httpPort, () => {
  debug('Ember server started listening for HTTP requests', { port: httpPort });
});
