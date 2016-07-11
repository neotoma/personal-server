var express = require('express');
var fs = require('fs');
var path = require('path');
var pluralize = require('pluralize');
var async = require('async');
var _ = require('underscore');
var app = express();

app.use('/assets/images', express.static('data/assets/images'));

var server = app.listen(process.env.PORT);

function dumpError(message, err) {
  console.error(message);

  if (typeof err === 'object') {
    if (err.message) {
      console.log('\nMessage: ' + err.message)
    }
    if (err.stack) {
      console.log('\nStacktrace:')
      console.log('====================')
      console.log(err.stack);
    }
  } else {
    console.log('dumpError :: argument is not an object');
  }
}

var convertItemUrlsToAbsolute = function(item, req) {
  var isRelativeUrlProperty = function(key, val) {
    return (key.indexOf('-url') === (key.length - 4) && val.indexOf('/') === 0);
  };

  var isRelativeUrlItemValue = function(item, key, val) {
    return (typeof item.id === 'string' && item.id.indexOf('Url') === (item.id.length - 3) && key === 'value');
  };

  item.attributes = _.mapObject(item.attributes, function(val, key) {
    return (isRelativeUrlProperty(key, val) || isRelativeUrlItemValue(item, key, val)) ? 'http://' + path.join(req.hostname + ':' + process.env.PORT, val) : val;
  });

  return item;
}

var sendData = function(req, res, data) {
  if (typeof data === 'undefined' || !data) {
    return res.status(500).send('Internal Server Error');
  }

  try {
    var json;

    if (Array.isArray(data)) {
      json = data.map(function(data) { return convertItemUrlsToAbsolute(JSON.parse(data), req); });
    } else {
      json = JSON.parse(data);

      if (Array.isArray(json)) {
        json = json.map(function(item) { return convertItemUrlsToAbsolute(item, req); });
      } else {
        json = convertItemUrlsToAbsolute(json, req);
      }
    }
  } catch(error) {
    dumpError('Unable to parse and process data', error);
    return res.status(500).send('Internal Server Error');
  }

  try {
    res.setHeader('Content-Type', 'application/json');

    if (Array.isArray(json)) {
      json = _.sortBy(json, 'id');
      json.reverse();

      if (req.query.filter) {
        json = json.filter(function(el, i) {
          for (var key in req.query.filter) {
            if (el.attributes[key] !== req.query.filter[key]) {
              return false;
            }
          }
          return true;
        });
      }

      if (req.query.limit) {
        json = json.slice(0, req.query.limit);
      }
    }

    if (!json || (Array.isArray(json) && json.length === 0)) {
      return res.status(404).send('Not Found');
    }

    res.send({ "data": json });
  } catch(error) {
    dumpError('Unable to send data', error);
    return res.status(500).send('Internal Server Error');
  }
};

var getResource = function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  var parts = req.path.split('/');

  if (!req.params.id) {
    var dir = __dirname + '/data/' + parts[1];

    fs.readdir(dir, function(error, files) {
      if (error || !files.length) {
        dumpError('Unable to read directory and find files', error);
        return res.status(500).send('Internal Server Error');
      }

      if (files.indexOf('index.json') !== -1) {
        fs.readFile(path.join(dir, 'index.json'), function(error, data) {
          sendData(req, res, data);
        });
      } else {
        var files = files.map(function(file) { 
          return path.join(dir, file); 
        }).filter(function(file) {
          if (file.indexOf('.json') !== -1) { 
            return file; 
          } 
        });

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
    return dumpError('Unable to read data directory for types', error);
  }

  files.forEach(function(filename) {
    fs.stat(path.join(__dirname, 'data', filename), function(error, stats) {
      if (error) {
        dumpError('Unable to stat file', filename, 'for directory status');
      } else if (stats.isDirectory() && filename !== 'assets') {
        app.get('/' + pluralize(filename) + '/:id?', getResource);
      }
    });
  });
});

module.exports = app;

console.log('Express server listening on port', process.env.PORT);