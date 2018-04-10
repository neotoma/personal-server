var bodyParser = require('body-parser'),
  debug = require('app/lib/debug'),
  compression = require('compression'),
  express = require('express'),
  getResourceObject = require('app/routes/get-resource-object'),
  getResourceObjects = require('app/routes/get-resource-objects'),
  model = require('app/lib/model'),
  path = require('path'),
  postMessage = require('app/routes/post-message'),
  app = express();

/**
 * Establish body-parser middleware with JSON API error handling
 */
app.use((req, res, next) => {
  var json = bodyParser.json({ type: ['application/vnd.api+json', 'application/json'] });

  json(req, res, (error) => {
    if (error) {
      sendError(res, error, 400);
    } else {
      next();
    }
  });
});
  
app.use(compression());

model.init({
  directories: process.env.PERSONAL_SERVER_MODEL_DIRS ? process.env.PERSONAL_SERVER_MODEL_DIRS : 'data',
  reload: (process.env.PERSONAL_SERVER_PRESERVE_MODEL !== 'true')
});

model.assetDirectories.forEach((path) => {
  app.use('/assets', express.static(path));
});

app.use('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/:type', getResourceObjects);
app.get('/:type/:id', getResourceObject);
app.post('/messages', postMessage);

module.exports = app;
