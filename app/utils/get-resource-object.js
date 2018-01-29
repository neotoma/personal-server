var app = require('app'),
  convertResourceObjectUrls = require('app/utils/convert-resource-object-urls'),
  debug = require('app/lib/debug'),
  fs = require('graceful-fs');

module.exports = function(type, id, req) {
  var json;

  app.dataDirectories.forEach((dataDirectory) => {
    var path = `${dataDirectory}/${type}/${id}.json`;

    if (fs.existsSync(path)) {
      var buffer = fs.readFileSync(path);

      try {
        json = JSON.parse(buffer);

        var markdownPath = `${dataDirectory}/${type}/${id}.md`;

        if (fs.existsSync(markdownPath)) {
          json.attributes.body = fs.readFileSync(markdownPath, "utf8");
        }

        if (req) {
          json = convertResourceObjectUrls(json, req);
        }
      } catch(error) {
        debug(`unable to get resource object from file: ${path}`);
      }
    }
  });

  return json;
};
