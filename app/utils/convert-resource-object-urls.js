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

  var isRelativeUrl = function(url) {
    return (url.indexOf('/') === 0);
  };

  Object.keys(resourceObject.attributes).forEach((key) => {
    var url = resourceObject.attributes[key];

    if (typeof url !== 'string' || !isImage(url)) { return; }

    if (isRelativeUrl(url)) {
      if (req.headers.host.indexOf('127.0.0.1') === 0 && process.env.PERSONAL_WEB_IMGIX_DEPLOY_HOST) {
        url = 'http://' + path.join(process.env.PERSONAL_WEB_IMGIX_DEPLOY_HOST, url);
      } else {
        url = 'http://' + path.join(req.headers.host, url);
      }
    }

    if (imgix) {
      resourceObject.attributes[key] = imgix.buildURL(url);

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

      resourceObject.attributes[`panoramic-${key}`] = imgix.buildURL(resourceObject.attributes[key], {
        fit: 'max',
        h: 1000,
        w: 5000
      });
    } else {
      resourceObject.attributes[key] = url;
    }
  });

  return resourceObject;
};
