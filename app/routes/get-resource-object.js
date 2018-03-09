var debug = require('app/lib/debug'),
  model = require('app/lib/model'),
  sendResourceDocument = require('app/utils/send-resource-document');

module.exports = function(req, res) {
  model.getResourceObject(req.params.type, req.params.id, (error, resourceObject) => {
    if (error) {
      return res.status(500).send('Internal Server Error');
    }
    
    sendResourceDocument(req, res, resourceObject);
  });
};
