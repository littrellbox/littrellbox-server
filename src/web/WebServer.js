const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const loginSystem = require('./login/LoginSystem');

let cors = require('cors');

//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('web');
logger.level = 'debug';

class WebServer {
  loginSystem = null;

  constructor(app) {
    this.app = app;
  }

  setupWebServer() {
    const corsOptions = {
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept']
    };
    //Origin, X-Requested-With, Content-Type, Accept
    this.app.use(cors(corsOptions));
    this.app.options('*', cors(corsOptions));

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(cookieParser());
    this.app.use(require('express-session')({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: false
    }));

    this.loginSystem = new loginSystem(this.app);
    this.loginSystem.setupLogin();

    logger.info("Express setup completed");
  }
}

module.exports = WebServer;