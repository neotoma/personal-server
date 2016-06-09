var express = require('express');
var fs = require('fs');
var app = express();

var server = app.listen(4201);

var getResource = function(req, res) {
  var parts = req.url.split('/');

  if (!req.params.id) {
    var filename = __dirname + '/data/' + parts[1] + '/index.json';
  } else {
    var filename = __dirname + '/data/' + parts[1] + '/' + req.params.id + '.json';
  }

  console.log('filename', filename);

  var file = fs.readFile(filename, 'utf8', function(error, data) {
    if (error || typeof data === 'undefined') {
      return res.status(400).send('Not found');
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(JSON.parse(data));
  });
};

app.get('/links/:id?', getResource);
app.get('/posts/:id?', getResource);

module.exports = app;