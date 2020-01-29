//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('socket');
logger.level = 'debug';

class SocketServer {
  constructor(socket) {
      this.io = socket;
  }

  setupSocketServer() {
    this.io.on('connection', function(socket){
      logger.info('User connected');
      
    })
    logger.info("Socket.IO started");
  }
}

module.exports = SocketServer;