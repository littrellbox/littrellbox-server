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
      let file = new Files({
        fileType: files.file[0].headers['content-type'],
        fileName: files.file[0].headers['name']
      });
      console.log(req);
      file.save().then(async (document) => {
        const buffer = fs.readFileSync(path);
        const data = await uploadFile(buffer, req.payload.id + "/" + document._id.toString(), files.file[0].headers['name'], files.file[0].headers['content-type']);
        document.fileURL = data.Location;
        document.save().then((document) => {
          res.statusCode = 200;
          res.end(document._id);
        });
      });
      res.statusCode = 500;
      res.end("unkerr");
    } catch (error) {
      res.statusCode = 500;
      logger.error(error);
      res.end(error.toString());
    }
  });
});

router.post('/upload/pfp', auth.required, (req, res, next) => {
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

router.get('/get/download/:file', (req, res, next) => {

});

router.get('/get/grab/:file', (req, res, next) => {
  
});

module.exports = router;
