var _ = require('underscore');
var path = require('path');

module.exports = function(resourceObject, req) {
  var isRelativeUrlProperty = function(key, val) {
    return (key.indexOf('-url') === (key.length - 4) && val.indexOf('/') === 0);
  };

  var isRelativeUrlItemValue = function(resourceObject, key, val) {
    return (typeof resourceObject.id === 'string' && resourceObject.id.indexOf('Url') === (resourceObject.id.length - 3) && key === 'value');
  };

  resourceObject.attributes = _.mapObject(resourceObject.attributes, function(val, key) {
    return (isRelativeUrlProperty(key, val) || isRelativeUrlItemValue(resourceObject, key, val)) ? 'http://' + path.join(req.headers.host, val) : val;
  });

  return resourceObject;
};
