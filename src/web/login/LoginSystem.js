const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const Account = require('./models/accounts');

const routes = require('./routes')

//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('login');
logger.level = 'debug';

class LoginSystem {
  constructor(app) {
    this.app = app;
  }

  setupLogin() {
    passport.use(new LocalStrategy(Account.authenticate()));
    passport.serializeUser(Account.serializeUser());
    passport.deserializeUser(Account.deserializeUser());

    this.app.use('/auth', routes);

    logger.info("Started login system")
  }
}

module.exports = LoginSystem;