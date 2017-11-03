var app = require('app');
var convertResourceObjectUrlsToAbsolute = require('app/utils/convert-resource-object-urls-to-absolute');
var fs = require('fs');

module.exports = function(type, id, req) {
  var json;

  app.dataDirectories.forEach((dataDirectory) => {
    if (fs.existsSync(`${dataDirectory}/${type}/${id}.json`)) {
      var buffer = fs.readFileSync(`${dataDirectory}/${type}/${id}.json`);
      json = JSON.parse(buffer);

      if (req) {
        json = convertResourceObjectUrlsToAbsolute(json, req);
      }
    }
  });

  return json;
};
