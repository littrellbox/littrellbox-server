const cookies = require('cookies');

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
      let cookiesUnparsed = socket.handshake.headers.cookie;
      let cookiesParsed = cookies(cookiesUnparsed);
      console.log(cookiesParsed);
    });
    logger.info("Socket.IO started");
  }
}

module.exports = SocketServer;