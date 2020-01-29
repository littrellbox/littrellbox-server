const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const loginSystem = require('./login/LoginSystem');

//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('web');
logger.level = 'debug';

class WebServer {
  secret = "dev secret"; //TODO: env variables

  loginSystem = null;

  constructor(app) {
    this.app = app;
  }

  setupWebServer() {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(cookieParser());
    this.app.use(require('express-session')({
        secret: this.secret,
        resave: false,
        saveUninitialized: false
    }));

    this.loginSystem = new loginSystem(this.app);
    this.loginSystem.setupLogin();

    logger.info("Express setup completed");
  }
}

module.exports = WebServer;