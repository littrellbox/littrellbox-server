//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('files');
logger.level = 'debug';

class FileSystem {
  constructor(app) {
    this.app = app;
  }

  setupFiles() {
    //don't import until needed to prevent errors
    const routes = require('./routes');
    this.app.use('/files', routes);

    logger.info("Started files system");
  }
}

module.exports = FileSystem;