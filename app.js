require('dotenv').config();
var express = require('express');
var fs = require('fs');
var path = require('path');
var pluralize = require('pluralize');
var async = require('async');
var _ = require('underscore');
var app = express();
var port = process.env.PERSONAL_SERVER_PORT;

app.use('/assets', express.static(process.env.PERSONAL_SERVER_DATA_DIR + '/assets'));

var server = app.listen(port);

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
    return (isRelativeUrlProperty(key, val) || isRelativeUrlItemValue(item, key, val)) ? 'http://' + path.join(req.headers.host, val) : val;
  });

  return item;
}

var sendData = function(req, res, data) {
  if (typeof data === 'undefined' || !data) {
    return res.status(404).send('Not Found');
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
      json = _.sortBy(json, function(item) {
        if (typeof item['published-at'] !== 'undefined') {
          return Number(item['published-at']);
        } else if (!isNaN(item['id'])) {
          return parseFloat(item['id']);
        } else {
          return item['id'];
        }
      });

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

    if (!json) {
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
    var dir = process.env.PERSONAL_SERVER_DATA_DIR + '/' + parts[1];

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
          if (file.indexOf('.json') !== -1 && file.indexOf('.backup') === -1) { 
            return file; 
          } 
        });

        async.map(files, fs.readFile, function(error, data) {
          sendData(req, res, data);
        });
      }
    });
  } else {
    var filename = process.env.PERSONAL_SERVER_DATA_DIR + '/' + parts[1] + '/' + req.params.id + '.json';

    fs.readFile(filename, function(error, data) {
      sendData(req, res, data);
    });
  }
};

fs.readdir(process.env.PERSONAL_SERVER_DATA_DIR, function(error, files) {
  if (error) {
    return dumpError('Unable to read data directory for types', error);
  }

  files.forEach(function(filename) {
    fs.stat(path.join(process.env.PERSONAL_SERVER_DATA_DIR, filename), function(error, stats) {
      if (error) {
        dumpError('Unable to stat file', filename, 'for directory status');
      } else if (stats.isDirectory() && filename !== 'assets') {
        app.get('/' + pluralize(filename) + '/:id?', getResource);
      }
    });
  });
});

module.exports = app;

console.log('Express server listening on port', port);