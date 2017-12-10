var async = require('async'),
  model = require('app/lib/model');

module.exports = function(resourceObject, types, req, done) {
  if (!resourceObject.relationships) { return done(); }

  async.map(resourceObject.relationships, (relationship, done) => {
    model.getOne(relationship.data.type, relationship.data.id, done);
  }, done);
};
