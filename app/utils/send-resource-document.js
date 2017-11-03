var _ = require('underscore');
var dumpError = require('app/utils/dump-error');
var getRelatedResourceObjects = require('app/utils/get-related-resource-documents');

module.exports = function(req, res, data) {
  if (typeof data === 'undefined' || !data) {
    return res.status(404).send('Not Found');
  }

  try {
    res.setHeader('Content-Type', 'application/json');

    if (Array.isArray(data)) {
      data = _.sortBy(data, function(item) {
        if (typeof item['published-at'] !== 'undefined') {
          return Number(item['published-at']);
        } else if (!isNaN(item['id'])) {
          return parseFloat(item['id']);
        } else {
          return item['id'];
        }
      });

      data.reverse();

      if (req.query.filter) {
        data = data.filter(function(el, i) {
          for (var key in req.query.filter) {
            if (el.attributes[key] !== req.query.filter[key]) {
              return false;
            }
          }
          return true;
        });
      }

      if (req.query.limit) {
        data = data.slice(0, req.query.limit);
      }
    }

    if (!data) {
      return res.status(404).send('Not Found');
    }

    var document = { data: data };

    if (req.query.include) {
      var include = req.query.include.split(',');
      var relatedResourceObjects = [];

      if (Array.isArray(data)) {
        data.forEach((resourceObject) => {
          relatedResourceObjects = relatedResourceObjects.concat(getRelatedResourceObjects(resourceObject, include, req));
        });
      } else {
        relatedResourceObjects = getRelatedResourceObjects(data, include, req);
      }

      if (relatedResourceObjects) {
        relatedResourceObjects = relatedResourceObjects.filter((n) => n);

        if (relatedResourceObjects.length > 0) {
          document.included = relatedResourceObjects;
        }
      }
    }

    res.send(document);
  } catch(error) {
    dumpError(error);
    return res.status(500).send('Internal Server Error');
  }
};