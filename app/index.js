var debug = require('app/lib/debug'),
  express = require('express'),
  getResourceObject = require('app/routes/get-resource-object'),
  getResourceObjects = require('app/routes/get-resource-objects'),
  model = require('app/lib/model'),
  path = require('path');

var app = module.exports = express();

model.init({
  app: app,
  directories: process.env.PERSONAL_SERVER_MODEL_DIRS ? process.env.PERSONAL_SERVER_MODEL_DIRS : 'data',
  reload: (process.env.PERSONAL_SERVER_PRESERVE_MODEL !== 'true')
});

app.use('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/:type', getResourceObjects);
app.get('/:type/:id', getResourceObject);
