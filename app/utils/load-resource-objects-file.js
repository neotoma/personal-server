var debug = require('debug')('personalServer:loadResourceObjectsFile'),
  fs = require('graceful-fs'),
  Path = require('path');

module.exports = function(model, path, event) {
  if (path.includes('index.js')) {
    model.deleteAll(Path.parse(path).dir.split('/').pop());
  }

  fs.readFile(path, (error, data) => {
    if (error) {
      return debug(`encountered error trying to read file: ${error.message}`);
    }

    try {
      var json = JSON.parse(data);
    } catch (error) {
      return debug(`unable to parse JSON from file ${path}`);
    }

    var resourceObjects = Array.isArray(json) ? json : [json];

    resourceObjects.forEach((resourceObject) => {
      if (!resourceObject.type || !resourceObject.id || !resourceObject.attributes) {
        return debug(`skipped non-resource-object ${path}`);
      }

      if (!resourceObject.attributes['published-at']) {
        model.deleteOne(resourceObject.type, resourceObject.id);
        return debug(`skipped unpublished object ${path}`);
      }

      model.setOne(resourceObject.type, resourceObject.id, resourceObject, (error) => {
        if (error) {
          return debug(`failed to load resource object file: ${path}`);
        }

        switch (event) {
          case 'add':
            debug(`added ${resourceObject.type} ${resourceObject.id}`);
            break;
          case 'change':
            debug(`changed ${resourceObject.type} ${resourceObject.id}`);
            break;
          default:
            debug(`loaded ${resourceObject.type} ${resourceObject.id}`);
            break;
        }
      });
    });
  });
};