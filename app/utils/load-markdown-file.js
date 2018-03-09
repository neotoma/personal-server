var debug = require('debug')('personalServer:loadMarkdownFile'),
  fs = require('graceful-fs'),
  Path = require('path');

module.exports = function(model, path, event) {
  fs.readFile(path, (error, data) => {
    if (error) {
      return debug(`encountered error trying to read file: ${error.message}`);
    }

    let body = fs.readFileSync(path, "utf8"),
      pathProperties = Path.parse(path),
      id = pathProperties.name,
      type = pathProperties.dir.split('/').pop();

    model.setOne('body-attributes', `${type}:${id}`, body);
  });
};