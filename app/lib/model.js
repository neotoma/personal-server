var _ = require('lodash'), 
  app = require('app'),
  async = require('async'),
  chokidar = require('chokidar'),
  debug = require('debug')('personalServer:model'),
  express = require('express'),
  isNumeric = require('app/utils/is-numeric'),
  loadMarkdownFile = require('app/utils/load-markdown-file'),
  loadResourceObjectsFile = require('app/utils/load-resource-objects-file'),
  redis = require('redis'),
  client = redis.createClient();

var model = {};

/**
 * Add all attributes from model to resource object
 * @param {Object} resourceObject – Resource object
 * @param {function} done - Error-first callback
 */
model.addAttributesToResourceObject = function(resourceObject, done) {
  if (!resourceObject) { return done(); }

  model.getResourceObjectAttributes(resourceObject.type, resourceObject.id, (error, attributes) => {
    if (attributes) {
      Object.keys(attributes).forEach((name) => {
        resourceObject.attributes[name] = attributes[name];
      });
    }

    done(error, resourceObject);
  });
};

model.deleteAll = function(type) {
  client.hgetall(type, (error, objects) => {
    if (!objects) { return; }

    objects = Object.values(objects).map((o) => JSON.parse(o));

    objects.forEach((object) => {
      if (object.id) {
        model.deleteOne(type, object.id);
      }
    });
  });
};

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

model.getResourceObjectAttributes = function(type, id, done) {
  client.smembers(`${type}:${id}`, (error, attributes) => {
    try {
      if (attributes.length) {
        try {
          let mergedAttributes = {};

          attributes.forEach((attribute) => {
            Object.assign(mergedAttributes, JSON.parse(attribute));
          });

          attributes = mergedAttributes;
        } catch(error) {
          debug('unable to parse getResourceObjectAttributes from model store', attributes);
        }
      }
    } catch (error) {
      debug('unable to parse JSON', type, id, error);
      return done(error);
    }

    done(error, attributes);
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

  var addAttributesToResourceObjects = (resourceObjects, done) => {
    if (resourceObjects && resourceObjects.length) {
      async.map(resourceObjects, model.addAttributesToResourceObject, done);
    } else {
      done();
    }
  };

  async.waterfall([getMany, addAttributesToResourceObjects], done);
};

/**
 * Set an attribute for a resourceObject in the model
 * @param {string} type – Resource object type
 * @param {string} id - Resource object ID
 * @param {string} name - Attribute name
 * @param {*} value - Attribute value
 */
model.setResourceObjectAttribute = function(type, id, name, value) {
  let attribute = {};
  attribute[name] = value;
  client.sadd(`${type}:${id}`, JSON.stringify(attribute));
  debug('setResourceObjectAttribute', `${type}:${id}`, JSON.stringify(attribute));
};

model.setOne = function(type, id, object, done) {
  client.hset(type, id, JSON.stringify(object), done);
};

model.getResourceObject = function(type, id, done) {
  var getOne = (done) => {
    model.getOne(type, id, done);
  };

  async.waterfall([getOne, model.addAttributesToResourceObject], done);
};

module.exports = model;
