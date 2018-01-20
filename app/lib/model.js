var _ = require('lodash'), 
  app = require('app'),
  async = require('async'),
  chokidar = require('chokidar'),
  debug = require('debug')('personalServer'),
  express = require('express'),
  fs = require('fs'),
  Path = require('path'),
  redis = require('redis'),
  client = redis.createClient();

var model = {};

model.init = function(options) {
  let directories = Array.isArray(options.directories) ? options.directories : options.directories.split(',');

  this.assetDirectories = [];

  directories.forEach((directory) => {
    this.assetDirectories.push(`${directory}/assets`);

    chokidar.watch(directory, {
      ignoreInitial: !options.reload
    }).on('all', (event, path) => {
      if (!['add', 'change'].includes(event)) { return; }
      if (!path.endsWith('.json')) { return; }
      if (path.indexOf('.backup') !== -1) { return; }

      fs.readFile(path, (error, data) => {
        try {
          var json = JSON.parse(data);
        } catch (error) {
          return debug(`unable to parse JSON from file ${path}`);
        }

        var resourceObjects = Array.isArray(json) ? json : [json];

        resourceObjects.forEach((resourceObject) => {
          if (!resourceObject.type || !resourceObject.id) {
            return debug(`skipped non-resource-object ${path}`);
          }

          var markdownPath = `${Path.dirname(path)}/${resourceObject.id}.md`;

          if (fs.existsSync(markdownPath)) {
            resourceObject.attributes.body = fs.readFileSync(markdownPath, "utf8");
          }

          model.setOne(resourceObject.type, resourceObject.id, resourceObject);

          switch (event) {
            case 'add':
              debug(`added ${resourceObject.type} ${resourceObject.id}`);
              break;
            case 'change':
              debug(`changed ${resourceObject.type} ${resourceObject.id}`);
              break;
          }
        });
      });
    });
  });
};

model.getOne = function(type, id, done) {
  client.hget(type, id, (error, value) => {
    done(error, JSON.parse(value));
  });
};

model.getMany = function(type, options, done) {
  if (typeof done === 'undefined') { done = options; unset(options); }

  client.hgetall(type, (error, resourceObjectsHash) => {
    if (!resourceObjectsHash) { return done(error); }

    var resourceObjects = Object.values(resourceObjectsHash).map((o) => JSON.parse(o));

    let filter = (done) => {
      if (!options.filter) { return done(); }

      resourceObjects = resourceObjects.filter((resourceObject) => {
        var passes = true;

        Object.keys(options.filter).forEach((key) => {
          var comparisonObject = (key === 'id') ? resourceObject : resourceObject.attributes;

          if (comparisonObject[key] !== options.filter[key]) {
            passes = false;
          }
        });

        return passes;
      });

      done();
    };

    let sort = (done) => {
      if (!options.sort) { return done(); }

      var asc = true;
      var sort = options.sort;

      if (options.sort[0] === '-') {
        asc = false;
        sort = options.sort.substring(1);
      }

      resourceObjects = _.sortBy(resourceObjects, (resourceObject) => resourceObject.attributes[_.kebabCase(sort)]);

      if (!asc) {
        resourceObjects.reverse();
      }

      done();
    };

    async.waterfall([filter, sort], (error) => {
      done(error, resourceObjects);
    });
  });
};

model.setOne = function(type, id, resourceObject) {
  client.hset(type, id, JSON.stringify(resourceObject));
};

module.exports = model;
