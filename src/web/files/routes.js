const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../login/auth');
const Files = mongoose.model('Files');
const fs = require('fs');
const request = require('request');
const AWS = require('aws-sdk');
const bluebird = require('bluebird');
const multiparty = require('multiparty');

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
    Bucket: bucket,
    ContentType: type,
    Key: `${folder}/${name}`
  };
  return s3.upload(params).promise();
};

const checkIsBrowserRenderable = function(filetype) {
  return filetype === "image/jpeg" || filetype === "image/gif" || filetype === "image/png";
};

router.post('/upload/file', auth.required, (req, res, next) => {
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
      const buffer = fs.readFileSync(path);
      const data = await uploadFile(buffer, req.payload.id, files.file[0].headers['content-type']);
      res.statusCode = 200;
      res.end(data.Location);
    } catch (error) {
      res.statusCode = 500;
      logger.error(error);
      res.end(error.toString());
    }
  });
});

router.post('/upload/pfp', auth.required, (req, res, next) => {
  
});

router.get('/get/download/:file', auth.optional, (req, res, next) => {

});

router.get('/get/grab/:file', auth.optional, (req, res, next) => {
  
});

module.exports = router;