var express = require('express');
var fs = require('fs');
var path = require('path');
var pluralize = require('pluralize');
var app = express();

app.use('/images', express.static('data/images'));

var server = app.listen(process.env.PORT);

var getResource = function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  var parts = req.url.split('/');

  if (!req.params.id) {
    var filename = __dirname + '/data/' + parts[1] + '/index.json';
  } else {
    var filename = __dirname + '/data/' + parts[1] + '/' + req.params.id + '.json';
  }

  var file = fs.readFile(filename, 'utf8', function(error, data) {
    if (error || typeof data === 'undefined') {
      return res.status(500).send('Internal Server Error');
    }

    try {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.parse(data));
      console.log('Served ', filename);
    } catch(error) {
      res.status(500).send('Internal Server Error');
      console.error('Unable to serve', filename);
    }
  });
};

module.exports = app;

console.log('Express server listening on port', process.env.PORT);

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
        console.log('Serving type', filename);
      }
    });
  });
});