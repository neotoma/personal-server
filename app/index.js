var dumpError = require('app/utils/dump-error');
var express = require('express');
var fs = require('fs');
var path = require('path');
var getResourceObject = require('app/routes/get-resource-object');
var getResourceObjects = require('app/routes/get-resource-objects');

var app = express();

if (!process.env.PERSONAL_SERVER_DATA_DIRS) {
  throw new Error('App failed to find server data directory variable from environment');
}

module.exports.dataDirectories = dataDirectories = process.env.PERSONAL_SERVER_DATA_DIRS.split(',');

dataDirectories.forEach((dataDirectory) => {
  app.use('/assets', express.static(`${dataDirectory}/assets`));
});

app.use('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/:type/:id', getResourceObject);
app.get('/:type', getResourceObjects);

module.exports = app;