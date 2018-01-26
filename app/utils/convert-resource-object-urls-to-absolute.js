var _ = require('underscore'),
  imgix,
  ImgixClient = require('imgix-core-js'),
  isImage = require('is-image'),
  path = require('path');

if (process.env.PERSONAL_WEB_IMGIX_HOST && process.env.PERSONAL_WEB_IMGIX_SECURITY_TOKEN) {
  imgix = new ImgixClient({
    host: process.env.PERSONAL_WEB_IMGIX_HOST,
    secureURLToken: process.env.PERSONAL_WEB_IMGIX_SECURITY_TOKEN
  });
}

module.exports = function(resourceObject, req) {
  if (!resourceObject || !req) { return; }

  var isRelativeUrlProperty = function(key, val) {
    return (key.indexOf('-url') === (key.length - 4) && val.indexOf('/') === 0);
  };

  var isRelativeUrlItemValue = function(resourceObject, key, val) {
    return (typeof resourceObject.id === 'string' && resourceObject.id.indexOf('Url') === (resourceObject.id.length - 3) && key === 'value');
  };

  Object.keys(resourceObject.attributes).forEach((key) => {
    var val = resourceObject.attributes[key];

    if (isRelativeUrlProperty(key, val) || isRelativeUrlItemValue(resourceObject, key, val)) {
      var url = 'http://' + path.join(req.headers.host, val);

      if (imgix) {
        if (req.headers.host.indexOf('127.0.0.1') === 0 && process.env.PERSONAL_WEB_IMGIX_DEPLOY_HOST) {
          url = 'http://' + path.join(process.env.PERSONAL_WEB_IMGIX_DEPLOY_HOST, val);
        }
        
        resourceObject.attributes[key] = imgix.buildURL(url);

        if (isImage(val)) {
          resourceObject.attributes[`thumb-${key}`] = imgix.buildURL(resourceObject.attributes[key], {
            crop: 'focalpoint',
            fit: 'crop',
            'max-h': 800,
            'max-w': 800
          });

          resourceObject.attributes[`large-${key}`] = imgix.buildURL(resourceObject.attributes[key], {
            fit: 'max',
            h: 2000,
            w: 2000
          });
        }
      } else {
        resourceObject.attributes[key] = url;
      }
    }
  });

  return resourceObject;
};
