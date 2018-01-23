var async = require('async'),
  model = require('app/lib/model');

module.exports = function(resourceObject, types, req, done) {
  if (!resourceObject.relationships) { return done(); }

  async.map(resourceObject.relationships, (relationship, done) => {
    if (Array.isArray(relationship.data)) {
      async.map(relationship.data, (data, done) => {
        model.getOne(data.type, data.id, done);
      }, done);
    } else {
      model.getOne(relationship.data.type, relationship.data.id, done);
    }
  }, (error, resourceObjects) => {
    if (error) { return done(error); }

    done(undefined, resourceObjects.reduce((a, b) => {
      return a.concat(b);
    }, []));
  });
};
