var model = require('app/lib/model'),
  sendResourceDocument = require('app/utils/send-resource-document');

module.exports = function(req, res) {
  model.getManyResourceObjects(req.params.type, {
    filter: req.query.filter,
    sort: req.query.sort
  }, (error, resourceObjects) => {
    if (error) {
      return res.status(500).send('Internal Server Error');
    }

    sendResourceDocument(req, res, resourceObjects);
  });
};
