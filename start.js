const chatServer = require('./src/ChatServer');
require('dotenv').config();

//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('startup');
logger.level = 'debug'; //TODO: get from env

//setup global variables
global.version = "0.1-alpha";

logger.info("Littrellbox server version: " + global.version);

let server = new chatServer();
server.startServer();