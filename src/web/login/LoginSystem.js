const Users = require('./models/Users');

//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('login');
logger.level = 'debug';

class LoginSystem {
  constructor(app) {
    this.app = app;
  }

  setupLogin() {
    //don't import until needed to prevent errors
    const routes = require('./routes');
    this.app.use('/auth', routes);

    logger.info("Started login system");
  }
}

module.exports = LoginSystem;