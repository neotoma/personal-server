var async = require('async'),
  debug = require('app/lib/debug'),
  model = require('app/lib/model'),
  nodemailer = require('nodemailer'),
  sendGridTransport = require('nodemailer-sendgrid-transport');

module.exports = function(req, res) {
  var getEmailResourceObject = (done) => {
    model.getOne('attributes', 'email', done);
  };

  var sendMessage = (emailResourceObject, done) => {
    if (!emailResourceObject) {
      return done(new Error('No recipient email address available'));
    }

    if (!process.env.PERSONAL_SERVER_SENDGRID_API_KEY) {
      return done(new Error('No SendGrid API key available'));
    }

    var email = {
      from: req.body.data.attributes['sender-email'],
      to: emailResourceObject.attributes['value'],
      subject: 'Message submitted to website',
      text: req.body.data.attributes['body']
    };

    debug('sending email', email);

    nodemailer.createTransport(sendGridTransport({
      auth: {
        api_key: process.env.PERSONAL_SERVER_SENDGRID_API_KEY
      }
    })).sendMail(email, done);
  };

  async.waterfall([getEmailResourceObject, sendMessage], (error) => {
    if (error) {
      debug('failed to send mail with SendGrid: %s', error.message);
      return res.status(500).send(error.message);
    }

    res.send({ 
      data: {
        id: 'message',
        type: 'messages',
        attributes: {
          'sender-email': req.body.data.attributes['sender-email'],
          body: req.body.data.attributes['body']
        }
      }
    });
  });
}
