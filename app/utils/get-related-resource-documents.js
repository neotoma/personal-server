var pluralize = require('pluralize');
var getResourceObject = require('app/utils/get-resource-object');

module.exports = function(resourceObject, types, req) {
  if (!resourceObject.relationships) { return; }

  var relatedResourceObjects = [];

  Object.keys(resourceObject.relationships).forEach((relationshipKey) => {
    relatedResourceObjects.push(getResourceObject(pluralize(relationshipKey), resourceObject.relationships[relationshipKey].data.id, req));
  });

  return relatedResourceObjects;
};