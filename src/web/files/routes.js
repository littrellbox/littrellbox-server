const mongoose = require('mongoose');
const router = require('express').Router();
const Attachments = mongoose.model('Attachments');
const Messages = mongoose.model('Messages');
const fs = require('fs');
const AWS = require('aws-sdk');
const bluebird = require('bluebird');
const multiparty = require('multiparty');
const jwt = require('jsonwebtoken');

const log4js = require('log4js');
const logger = log4js.getLogger('files');
logger.level = 'debug';

AWS.config.update({
  endpoint: new AWS.Endpoint(process.env.S3_ENDPOINT),
  accessKeyId: process.env.S3_ACCESS,
  secretAccessKey: process.env.S3_SECRET,
  s3ForcePathStyle: Boolean(process.env.S3_FORCEPATHSTYLE)
});

AWS.config.setPromisesDependency(bluebird);

const s3 = new AWS.S3();

const uploadFile = (buffer, folder, name, type) => {
  const params = { 
    ACL: 'public-read',
    Body: buffer,
    Bucket: process.env.S3_BUCKET,
    ContentType: type,
    Key: `${folder}/${name}`
  };
  return s3.upload(params).promise();
};

const checkIsBrowserRenderable = function(filetype) {
  return filetype === "image/jpeg" || filetype === "image/gif" || filetype === "image/png";
};

router.post('/upload/file', (req, res) => {
  const form = new multiparty.Form();
  
  form.parse(req, async (error, fields, files) => {
    logger.debug("got request to upload file");
    if (error) throw new Error(error);
    try {
      jwt.verify(fields.token[0], process.env.JWT_SECRET, function(err, decode) {
        if(!decode) {
          return;
        }
        const path = files.file[0].path;
        if(files.file[0].size > 8*1024*1024) {
          res.statusCode = 400;
          res.end("file_too_big");
          return;
        }
        let file = new Attachments({
          type: "file",
          userId: decode.id,
          name: fields.name[0],
          data: {
            type: files.file[0].headers['content-type'],
            url: ""
          },
          messageId: fields.message[0]
        });
        Messages.findById(file.messageId).then((messageDocument) => {
          if(messageDocument.userId === decode.id) {
            file.save().then(async (document) => {
              const buffer = fs.readFileSync(path);
              const data = await uploadFile(buffer, decode.id + "/" + document._id.toString(), fields.name[0], files.file[0].headers['content-type']);
              document.data.url = data.Location;
              document.save().then((document) => {
                res.statusCode = 200;
                res.json({success: true});
                logger.debug("file " + document._id + " uploaded successfully");
                global.io.to("channel-in-" + document.channelId).emit("updateattachment", file);
              });
            });
          }
        });
      });
    } catch (error) {
      res.statusCode = 500;
      logger.error(error);
      res.end(error.toString());
    }
  });
});

router.post('/upload/pfp', (req, res) => {
  const form = new multiparty.Form();
  
  form.parse(req, async (error, fields, files) => {
    if (error) throw new Error(error);
    try {
      const path = files.file[0].path;
      if(files.file[0].size > 8*1024*1024) {
        res.statusCode = 400;
        res.end("file_too_big");
        return;
      }
      if(!checkIsBrowserRenderable(files.file[0].headers['content-type'])) {
        response.statusCode = 400;
        response.end("invalid_file_type");
        return;
      }
      const buffer = fs.readFileSync(path);
      const data = await uploadFile(buffer, "pfp", files.file[0].headers['name'], files.file[0].headers['content-type']);
      res.statusCode = 200;
      res.end(data.Location);
    } catch (error) {
      res.statusCode = 500;
      logger.error(error);
      res.end(error.toString());
    }
  });
});

module.exports = router;
