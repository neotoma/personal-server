var app = require('app');
var convertResourceObjectUrlsToAbsolute = require('app/utils/convert-resource-object-urls-to-absolute');
var fs = require('fs');

module.exports = function(type, id, req) {
  var buffer = fs.readFileSync(`${app.dataDirectory}/${type}/${id}.json`);
  var json = JSON.parse(buffer);

  if (req) {
    json = convertResourceObjectUrlsToAbsolute(json, req);
  }

  return json;
};
