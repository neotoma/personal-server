var _ = require('underscore'),
  imgix,
  ImgixClient = require('imgix-core-js'),
  isImage = require('is-image'),
  path = require('path'),
  ranger = require('park-ranger')();

if (process.env.PERSONAL_SERVER_IMGIX_HOST && process.env.PERSONAL_SERVER_IMGIX_SECURITY_TOKEN) {
  imgix = new ImgixClient({
    host: process.env.PERSONAL_SERVER_IMGIX_HOST,
    secureURLToken: process.env.PERSONAL_SERVER_IMGIX_SECURITY_TOKEN
  });
}

let protocol = (ranger.cert) ? 'https' : 'http';

module.exports = function(resourceObject, req) {
  if (!resourceObject || !req) { return; }

  var isRelativeUrl = function(url) {
    return (url.indexOf('/') === 0);
  };

  Object.keys(resourceObject.attributes).forEach((key) => {
    var url = resourceObject.attributes[key];

    if (typeof url !== 'string') { return; }

    if (isRelativeUrl(url)) {
      if (isImage(url) && req.headers.host.indexOf('127.0.0.1') === 0 && process.env.PERSONAL_SERVER_IMGIX_DEPLOY_HOST) {
        url = `${protocol}://${path.join(process.env.PERSONAL_SERVER_IMGIX_DEPLOY_HOST, url)}`;
      } else {
        url = `${protocol}://${path.join(req.headers.host, url)}`;
      }
    }

    if (isImage(url) && imgix) {
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
