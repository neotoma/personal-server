var app = require('app');
var async = require('async');
var dumpError = require('app/utils/dump-error');
var fs = require('fs');
var path = require('path');
var getResourceObject = require('app/utils/get-resource-object');
var sendResourceDocument = require('app/utils/send-resource-document');

module.exports = function(req, res) {
  try {
    sendResourceDocument(req, res, getResourceObject(req.params.type, req.params.id, req));
  } catch(error) {
    dumpError(error);
    return res.status(500).send('Internal Server Error');
  }
};