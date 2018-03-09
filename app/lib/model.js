var _ = require('lodash'), 
  app = require('app'),
  async = require('async'),
  chokidar = require('chokidar'),
  express = require('express'),
  isNumeric = require('app/utils/is-numeric'),
  loadMarkdownFile = require('app/utils/load-markdown-file'),
  loadResourceObjectsFile = require('app/utils/load-resource-objects-file'),
  redis = require('redis'),
  client = redis.createClient();

var model = {};

model.deleteOne = function(type, id) {
  client.hdel(type, id);
};

model.init = function(options) {
  client.flushdb();

  let directories = Array.isArray(options.directories) ? options.directories : options.directories.split(',');

  this.assetDirectories = [];

  directories.forEach((directory) => {
    this.assetDirectories.push(`${directory}/assets`);

    chokidar.watch(directory, {
      ignoreInitial: !options.reload
    }).on('all', (event, path) => {
      if (!['add', 'change'].includes(event)) { return; }
      if (path.indexOf('.backup') !== -1) { return; }

      if (path.endsWith('.json')) {
        loadResourceObjectsFile(model, path, event);
      } else if (path.endsWith('.md')) {
        loadMarkdownFile(model, path, event);
      }
    });
  });
};

model.getBodyAttribute = function(type, id, done) {
  model.getOne('body-attributes', `${type}:${id}`, done);
};

model.getOne = function(type, id, done) {
  client.hget(type, id, (error, value) => {
    done(error, JSON.parse(value));
  });
};

model.getMany = function(type, options, done) {
  if (typeof done === 'undefined') { done = options; unset(options); }

  client.hgetall(type, (error, resourceObjectsHash) => {
    if (!resourceObjectsHash) { return done(error, null); }

    var resourceObjects = Object.values(resourceObjectsHash).map((o) => JSON.parse(o));

    let filter = (done) => {
      if (!options.filter) { return done(); }

      resourceObjects = resourceObjects.filter((resourceObject) => {
        var passes = true;

        Object.keys(options.filter).forEach((key) => {
          var comparisonObject = (key === 'id') ? resourceObject : resourceObject.attributes;
          var filterValue = isNumeric(options.filter[key]) ? parseInt(options.filter[key]) : options.filter[key];

          if (comparisonObject[key] !== filterValue) {
            passes = false;
          }
        });

        return passes;
      });

      done();
    };

    let sort = (done) => {
      if (!options.sort) { return done(); }

      var sortByNames = [], 
        sortByOrders = [];

      var attribute = function(resourceObject, propertyName) {
        if (propertyName === 'id') {
          return resourceObject.id;
        } else {
          return resourceObject.attributes[_.kebabCase(propertyName)];
        }
      };

      options.sort.split(',').forEach((sort) => {
        if (options.sort[0] === '-') {
          sortByNames.push(function(resourceObject) {
            return attribute(resourceObject, sort.substring(1));
          });
          sortByOrders.push('desc');
        } else {
          sortByNames.push(function(resourceObject) {
            return attribute(resourceObject, sort);
          });
          sortByOrders.push('asc');
        }
      });

      resourceObjects = _.orderBy(resourceObjects, sortByNames, sortByOrders);
      done();
    };

    async.waterfall([filter, sort], (error) => {
      done(error, resourceObjects);
    });
  });
};

model.getManyResourceObjects = function(type, id, done) {
  var getMany = (done) => {
    model.getMany(type, id, done);
  };

  var getBody = (resourceObjects, done) => {
    if (resourceObjects && resourceObjects.length) {
      async.map(resourceObjects, (resourceObject, done) => {
        model.getBodyAttribute(resourceObject.type, resourceObject.id, (error, body) => {
          if (body) {
            resourceObject.attributes.body = body;
          }

          done(error, resourceObject);
        })
      }, done);
    } else {
      done();
    }
  };

  async.waterfall([getMany, getBody], done);
};

model.setOne = function(type, id, object, done) {
  client.hset(type, id, JSON.stringify(object), done);
};

model.getResourceObject = function(type, id, done) {
  var getOne = (done) => {
    model.getOne(type, id, done);
  };

  var getBody = (resourceObject, done) => {
    if (resourceObject) {
      model.getBodyAttribute(type, id, (error, body) => {
        if (body) {
          resourceObject.attributes.body = body;
        }

        done(error, resourceObject);
      });
    } else {
      done();
    }
  };

  async.waterfall([getOne, getBody], done);
};

module.exports = model;
