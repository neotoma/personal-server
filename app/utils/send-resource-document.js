var _ = require('lodash'),
  async = require('async'),
  convertResourceObjectUrlsToAbsolute = require('app/utils/convert-resource-object-urls-to-absolute'),
  debug = require('app/lib/debug'),
  getRelatedResourceObjects = require('app/utils/get-related-resource-objects');

module.exports = function(req, res, data) {
  let included;

  if (!data) {
    return res.status(404).send('Not Found');
  }

  let limit = (done) => {
    if (!Array.isArray(data)) { return done(); }

    if (req.query.limit) {
      data = data.slice(0, req.query.limit);
    }

    done();
  };

  let convertUrls = (done) => {
    if (Array.isArray(data)) {
      data.map((resourceObject) => {
        return convertResourceObjectUrlsToAbsolute(resourceObject, req);
      });
    } else {
      data = convertResourceObjectUrlsToAbsolute(data, req);
    }

    done();
  };

  let include = (done) => {
    if (!req.query.include) { return done(); }

    var include = req.query.include.split(',');
    var relatedResourceObjects = [];
    var resourceObjects = Array.isArray(data) ? data : [data];

    async.map(resourceObjects, (resourceObject, done) => {
      getRelatedResourceObjects(resourceObject, include, req, done);
    }, (error, relatedResourceObjects) => {
      if (relatedResourceObjects) {
        relatedResourceObjects = _.flatten(relatedResourceObjects.filter((o) => o));

        if (relatedResourceObjects.length > 0) {
          included = relatedResourceObjects;
        }
      }

      relatedResourceObjects.map((relatedResourceObject) => {
        return convertResourceObjectUrlsToAbsolute(relatedResourceObject, req);
      });

      done(error, relatedResourceObjects);
    });
  };

  async.waterfall([limit, convertUrls, include], (error) => {
    res.setHeader('Content-Type', 'application/json');

    if (error) {
      res.status(500).send('Internal Server Error');
    } else if (!data) {
      res.status(404).send('Not Found');
    } else {
      res.send({ 
        data: data,
        included: included
      });
    }
  });
};
