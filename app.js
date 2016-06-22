var express = require('express');
var fs = require('fs');
var path = require('path');
var pluralize = require('pluralize');
var async = require('async');
var _ = require('underscore');
var app = express();

app.use('/images', express.static('data/images'));

var server = app.listen(process.env.PORT);

var sendData = function(req, res, data) {
  if (typeof data === 'undefined' || !data) {
    return res.status(500).send('Internal Server Error');
  }

  try {
    var json;

    if (Array.isArray(data)) {
      json = data.map(function(data) { return JSON.parse(data); });
    } else {
      json = JSON.parse(data);
    }

    res.setHeader('Content-Type', 'application/json');

    if (Array.isArray(json)) {
      if (req.query.limit) {
        json = json.slice(0, req.query.limit);
      }

      json = _.sortBy(json, "id");
      json.reverse();
    }

    res.send({ "data": json });
  } catch(error) {
    res.status(500).send('Internal Server Error');
    console.error('Unable to send data', error);
  }
};

var getResource = function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  var parts = req.path.split('/');

  if (!req.params.id) {
    var dir = __dirname + '/data/' + parts[1];
    console.log('GET', parts[1]);

    fs.readdir(dir, function(error, files) {
      if (error || !files.length) {
        console.error('Unable to read directory and find files', error);
        return res.status(500).send('Internal Server Error');
      }

      if (files.indexOf('index.json') !== -1) {
        fs.readFile(path.join(dir, 'index.json'), function(error, data) {
          sendData(req, res, data);
        });
      } else {
        var files = files.map(function(file) { return path.join(dir, file); });

        async.map(files, fs.readFile, function(error, data) {
          sendData(req, res, data);
        });
      }
    });
  } else {
    var filename = __dirname + '/data/' + parts[1] + '/' + req.params.id + '.json';

    fs.readFile(filename, function(error, data) {
      sendData(req, res, data);
    });
  }
};

fs.readdir(path.join(__dirname, 'data'), function(error, files) {
  if (error) {
    return console.error('Unable to read data directory for types', error);
  }

  files.forEach(function(filename) {
    fs.stat(path.join(__dirname, 'data', filename), function(error, stats) {
      if (error) {
        console.error('Unable to stat file', filename, 'for directory status');
      } else if (stats.isDirectory() && filename !== 'images') {
        app.get('/' + pluralize(filename) + '/:id?', getResource);
      }
    });
  });
});

module.exports = app;

console.log('Express server listening on port', process.env.PORT);